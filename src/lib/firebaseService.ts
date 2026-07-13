import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, collection, addDoc } from 'firebase/firestore';
import { TravelPlan } from '../types';

const COLLECTION_NAME = 'shared_plans';

/**
 * Creates a new shared plan on Firestore
 */
export async function createSharedPlan(plan: TravelPlan): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...plan,
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating shared plan:', error);
    throw error;
  }
}

/**
 * Updates an existing shared plan on Firestore
 */
export async function updateSharedPlan(planId: string, plan: TravelPlan): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, planId);
    await setDoc(docRef, {
      ...plan,
      id: planId, // Keep document ID inside the plan object for reference
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating shared plan:', error);
    throw error;
  }
}

/**
 * Fetches a shared plan once
 */
export async function getSharedPlan(planId: string): Promise<TravelPlan | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, planId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as TravelPlan;
    }
    return null;
  } catch (error) {
    console.error('Error fetching shared plan:', error);
    throw error;
  }
}

/**
 * Subscribes to real-time updates of a shared plan
 */
export function subscribeToSharedPlan(planId: string, onUpdate: (plan: TravelPlan) => void, onError?: (err: any) => void) {
  const docRef = doc(db, COLLECTION_NAME, planId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as TravelPlan);
    }
  }, (error) => {
    console.error('Error in shared plan subscription:', error);
    if (onError) onError(error);
  });
}
