import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { TravelPlan } from '../types';
import { User } from 'firebase/auth';

const COLLECTION_NAME = 'shared_plans';

export function isFirestoreQuotaError(error: unknown): boolean {
  const code = String((error as any)?.code || '').toLowerCase();
  const message = String((error as any)?.message || '').toLowerCase();

  return (
    code === 'resource-exhausted' ||
    message.includes('quota limit exceeded') ||
    message.includes('free daily write')
  );
}

export type FirestoreWriteState = 'available' | 'quota_exhausted' | 'recovering';
let writeState: FirestoreWriteState = 'available';

export function getFirestoreWriteState(): FirestoreWriteState {
  return writeState;
}

export function setFirestoreQuotaExhausted(): void {
  if (writeState !== 'quota_exhausted') {
    writeState = 'quota_exhausted';
    updateSyncStatus('local_only');
  }
}

export type CloudSyncStatus =
  | 'saved'
  | 'saving'
  | 'local_only'
  | 'sync_error'
  | 'conflict';

type SyncListener = (status: CloudSyncStatus) => void;
const syncListeners = new Set<SyncListener>();
let currentSyncStatus: CloudSyncStatus = 'saved';

export function getCloudSyncStatus(): CloudSyncStatus {
  return currentSyncStatus;
}

export function subscribeToSyncStatus(listener: SyncListener): () => void {
  syncListeners.add(listener);
  listener(currentSyncStatus);
  return () => {
    syncListeners.delete(listener);
  };
}

function updateSyncStatus(status: CloudSyncStatus) {
  currentSyncStatus = status;
  syncListeners.forEach((fn) => fn(status));
}

export function logFirestoreWriteTrace(info: {
  source: string;
  collection: string;
  documentId: string;
  reason: string;
  isDebounced?: boolean;
  isCoalesced?: boolean;
  syncStatus?: string;
  errorCode?: string;
}) {
  console.log(`[FIRESTORE_WRITE_TRACE]`, {
    ...info,
    timestamp: new Date().toISOString()
  });
}

// Outbox structures
export type SharedPlanOutbox = {
  planId: string;
  latestPlan: TravelPlan;
  baseRevision?: number;
  clientMutationId: string;
  queuedAt: string;
  lastAttemptAt?: string;
  failureCode?: string;
};

function getOutboxKey(planId: string): string {
  return `trippo_shared_outbox_${planId}`;
}

export function getLocalOutbox(planId: string): SharedPlanOutbox | null {
  try {
    const raw = localStorage.getItem(getOutboxKey(planId));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveLocalOutbox(planId: string, plan: TravelPlan): void {
  try {
    const existing = getLocalOutbox(planId);
    const outboxData: SharedPlanOutbox = {
      planId,
      latestPlan: plan,
      baseRevision: (plan as any).revision || existing?.baseRevision || 1,
      clientMutationId: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      queuedAt: existing?.queuedAt || new Date().toISOString(),
      lastAttemptAt: new Date().toISOString()
    };
    localStorage.setItem(getOutboxKey(planId), JSON.stringify(outboxData));
  } catch (e) {}
}

export function clearLocalOutbox(planId: string): void {
  try {
    localStorage.removeItem(getOutboxKey(planId));
  } catch (e) {}
}

const sanitizeForFirestore = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj instanceof Timestamp) return obj;
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  const newObj: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = sanitizeForFirestore(obj[key]);
    }
  }
  return newObj;
};

const preparePlanForFirestore = (plan: TravelPlan): any => {
  const cloned = JSON.parse(JSON.stringify(plan));
  if (cloned.timezone && cloned.timezone.resolvedAt) {
    try {
      cloned.timezone.resolvedAt = Timestamp.fromDate(new Date(cloned.timezone.resolvedAt));
    } catch (e) {
      console.error("Failed to parse timezone.resolvedAt for Firestore:", e);
    }
  }
  return cloned;
};

const parsePlanFromFirestore = (plan: any): TravelPlan => {
  if (plan && plan.timezone && plan.timezone.resolvedAt) {
    const resolvedAt = plan.timezone.resolvedAt;
    if (resolvedAt && typeof resolvedAt.toDate === 'function') {
      plan.timezone.resolvedAt = resolvedAt.toDate().toISOString();
    } else if (resolvedAt && typeof resolvedAt === 'object' && resolvedAt.seconds !== undefined) {
      plan.timezone.resolvedAt = new Date(resolvedAt.seconds * 1000).toISOString();
    }
  }
  return plan as TravelPlan;
};


/**
 * Syncs user info to 'users' collection on login/auth change
 * Skip writing if user document already matched in local cache to reduce startup writes.
 */
export async function syncUserToFirestore(user: User): Promise<void> {
  const cacheKey = `user_profile_${user.uid}`;
  const userData = {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
    email: user.email || '',
    photoURL: user.photoURL || ''
  };

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (
        parsed.displayName === userData.displayName &&
        parsed.email === userData.email &&
        parsed.photoURL === userData.photoURL
      ) {
        // Unchanged user data -> skip Firestore write completely!
        return;
      }
    }
  } catch (e) {}

  logFirestoreWriteTrace({
    source: 'syncUserToFirestore',
    collection: 'users',
    documentId: user.uid,
    reason: 'Profile created or updated'
  });

  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { ...userData, updatedAt: new Date().toISOString() }, { merge: true });
    localStorage.setItem(cacheKey, JSON.stringify(userData));
  } catch (error: any) {
    if (isFirestoreQuotaError(error)) {
      setFirestoreQuotaExhausted();
    }
    console.warn('Firestore sync user warning (using local fallback):', error?.message || error);
    try {
      localStorage.setItem(`user_${user.uid}`, JSON.stringify(userData));
    } catch (e) {}
  }
}

/**
 * Searches for registered users from 'users' collection by email or name
 */
export async function searchUsers(searchTerm: string): Promise<any[]> {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    const results: any[] = [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const email = (data.email || '').toLowerCase();
      const name = (data.displayName || '').toLowerCase();
      if (email.includes(term) || name.includes(term)) {
        results.push({
          uid: data.uid,
          displayName: data.displayName || 'Unknown User',
          email: data.email || '',
          photoURL: data.photoURL || ''
        });
      }
    });
    return results;
  } catch (error: any) {
    console.warn('Error searching users in Firestore, returning empty list:', error?.message || error);
    return [];
  }
}

/**
 * Creates a new shared plan on Firestore
 */
export async function createSharedPlan(plan: TravelPlan): Promise<string> {
  const prepared = preparePlanForFirestore(plan);
  const payload = sanitizeForFirestore({
    ...prepared,
    updatedAt: new Date().toISOString()
  });

  logFirestoreWriteTrace({
    source: 'createSharedPlan',
    collection: COLLECTION_NAME,
    documentId: plan.id || 'auto',
    reason: 'New shared plan created'
  });

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
    updateSyncStatus('saved');
    return docRef.id;
  } catch (error: any) {
    if (isFirestoreQuotaError(error)) {
      setFirestoreQuotaExhausted();
    } else {
      updateSyncStatus('sync_error');
    }
    console.warn('Firestore write quota exceeded or network error, falling back to local storage:', error?.message || error);
    const fallbackId = plan.id || `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    saveLocalOutbox(fallbackId, plan);
    try {
      localStorage.setItem(`shared_plan_${fallbackId}`, JSON.stringify({
        ...plan,
        id: fallbackId,
        updatedAt: new Date().toISOString()
      }));
    } catch (e) {}
    return fallbackId;
  }
}

// Debounce & coalescing state for updateSharedPlan
const pendingSaveTimers = new Map<string, NodeJS.Timeout>();
const pendingSavePlans = new Map<string, TravelPlan>();
const isSavingPlan = new Map<string, boolean>();

/**
 * Updates an existing shared plan on Firestore with 1,000ms debounce and maxWait coalescing
 */
export async function updateSharedPlan(planId: string, plan: TravelPlan): Promise<void> {
  // Always update local storage and outbox immediately
  saveLocalOutbox(planId, plan);
  try {
    localStorage.setItem(`shared_plan_${planId}`, JSON.stringify({
      ...plan,
      id: planId,
      updatedAt: new Date().toISOString()
    }));
  } catch (e) {}

  if (writeState === 'quota_exhausted') {
    updateSyncStatus('local_only');
    logFirestoreWriteTrace({
      source: 'updateSharedPlan',
      collection: COLLECTION_NAME,
      documentId: planId,
      reason: 'Circuit breaker active: skipped remote write',
      syncStatus: 'local_only'
    });
    return;
  }

  pendingSavePlans.set(planId, plan);
  updateSyncStatus('saving');

  if (pendingSaveTimers.has(planId)) {
    clearTimeout(pendingSaveTimers.get(planId)!);
  }

  const timer = setTimeout(async () => {
    pendingSaveTimers.delete(planId);
    if (isSavingPlan.get(planId)) {
      // Re-queue if already in-flight
      updateSharedPlan(planId, pendingSavePlans.get(planId) || plan);
      return;
    }

    const latestPlanToSave = pendingSavePlans.get(planId);
    if (!latestPlanToSave) return;
    pendingSavePlans.delete(planId);

    isSavingPlan.set(planId, true);
    const prepared = preparePlanForFirestore(latestPlanToSave);
    const payload = sanitizeForFirestore({
      ...prepared,
      id: planId,
      updatedAt: new Date().toISOString()
    });

    logFirestoreWriteTrace({
      source: 'updateSharedPlan',
      collection: COLLECTION_NAME,
      documentId: planId,
      reason: 'Debounced shared plan update',
      isDebounced: true,
      isCoalesced: true
    });

    try {
      const docRef = doc(db, COLLECTION_NAME, planId);
      await setDoc(docRef, payload);
      clearLocalOutbox(planId);
      updateSyncStatus('saved');
    } catch (error: any) {
      if (isFirestoreQuotaError(error)) {
        setFirestoreQuotaExhausted();
        logFirestoreWriteTrace({
          source: 'updateSharedPlan',
          collection: COLLECTION_NAME,
          documentId: planId,
          reason: 'Quota limit exceeded during plan save',
          errorCode: 'resource-exhausted',
          syncStatus: 'local_only'
        });
      } else {
        updateSyncStatus('sync_error');
      }
    } finally {
      isSavingPlan.set(planId, false);
      if (pendingSavePlans.has(planId)) {
        updateSharedPlan(planId, pendingSavePlans.get(planId)!);
      }
    }
  }, 1000);

  pendingSaveTimers.set(planId, timer);
}

/**
 * Fetches a shared plan once
 */
export async function getSharedPlan(planId: string): Promise<TravelPlan | null> {
  // Check outbox first for pending local unsynced edits
  const outbox = getLocalOutbox(planId);
  if (outbox?.latestPlan) {
    return outbox.latestPlan;
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, planId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return parsePlanFromFirestore(docSnap.data());
    }
  } catch (error: any) {
    console.warn('Firestore get shared plan error, attempting local storage fallback:', error?.message || error);
  }

  // Local storage fallback
  try {
    const localData = localStorage.getItem(`shared_plan_${planId}`);
    if (localData) {
      return JSON.parse(localData) as TravelPlan;
    }
  } catch (e) {}

  return null;
}

/**
 * Subscribes to real-time updates of a shared plan
 */
export function subscribeToSharedPlan(planId: string, onUpdate: (plan: TravelPlan) => void, onError?: (err: any) => void) {
  const docRef = doc(db, COLLECTION_NAME, planId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const serverPlan = parsePlanFromFirestore(docSnap.data());
      const outbox = getLocalOutbox(planId);

      // If we have local unsynced outbox changes, do not let stale server snapshot overwrite local work
      if (outbox && outbox.latestPlan) {
        const serverUpdatedAt = new Date((serverPlan as any).updatedAt || 0).getTime();
        const localQueuedAt = new Date(outbox.queuedAt || 0).getTime();

        if (serverUpdatedAt > localQueuedAt) {
          // Conflict detected: server has newer edits than local base revision
          updateSyncStatus('conflict');
        } else {
          // Ignore stale server snapshot while local edits are pending
          return;
        }
      }

      onUpdate(serverPlan);
    }
  }, (error) => {
    if (isFirestoreQuotaError(error)) {
      setFirestoreQuotaExhausted();
    }
    console.warn('Firestore snapshot subscription warning:', error?.message || error);
    if (onError) onError(error);

    // Initial check from local storage / outbox as graceful degraded experience
    try {
      const outbox = getLocalOutbox(planId);
      if (outbox?.latestPlan) {
        onUpdate(outbox.latestPlan);
        return;
      }
      const localData = localStorage.getItem(`shared_plan_${planId}`);
      if (localData) {
        onUpdate(JSON.parse(localData) as TravelPlan);
      }
    } catch (e) {}
  });
}

