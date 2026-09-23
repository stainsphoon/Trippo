import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CustomStamp } from '../types';

const CUSTOM_STAMPS_COLLECTION = 'custom_stamps';
const DEFAULT_STAMPS_COLLECTION = 'default_stamps';

export const getCustomStamps = async (): Promise<CustomStamp[]> => {
  try {
    const q = query(collection(db, CUSTOM_STAMPS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const remoteStamps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomStamp));
    
    // Merge local stamps
    let localStamps: CustomStamp[] = [];
    try {
      const saved = localStorage.getItem('local_custom_stamps');
      if (saved) localStamps = JSON.parse(saved);
    } catch (e) {}

    const combinedMap = new Map<string, CustomStamp>();
    [...remoteStamps, ...localStamps].forEach(s => combinedMap.set(s.id, s));
    return Array.from(combinedMap.values());
  } catch (error: any) {
    console.warn("Firestore getCustomStamps warning (falling back to local storage):", error?.message || error);
    try {
      const saved = localStorage.getItem('local_custom_stamps');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  }
};

export const getDefaultStamps = async (): Promise<CustomStamp[]> => {
  const japanStamps = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => ({
    id: `japan-${i}`,
    imageUrl: `/stamps/${i === 4 ? 'japan' : 'Japan'}_${i} 1.png`,
    createdAt: 0
  }));
  return [
    { id: 'default-1', imageUrl: '/stamps/Stamp.png', createdAt: 0 },
    { id: 'default-2', imageUrl: '/stamps/Stamp1.png', createdAt: 0 },
    { id: 'default-3', imageUrl: '/stamps/Stamp2.png', createdAt: 0 },
    ...Array.from({ length: 9 }, (_, i) => ({ id: `korea-${i + 1}`, imageUrl: `/stamps/Korea_${i + 1} 1.png`, createdAt: 0 })),
    ...japanStamps,
  ];
};

export const addCustomStamp = async (imageUrl: string): Promise<CustomStamp | null> => {
  const id = `stamp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newStamp: CustomStamp = {
    id,
    imageUrl,
    createdAt: Date.now(),
  };

  // Always save locally first
  try {
    const saved = localStorage.getItem('local_custom_stamps');
    const existing: CustomStamp[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem('local_custom_stamps', JSON.stringify([newStamp, ...existing]));
  } catch (e) {}

  try {
    const newStampRef = doc(db, CUSTOM_STAMPS_COLLECTION, id);
    await setDoc(newStampRef, newStamp);
  } catch (error: any) {
    console.warn("Firestore addCustomStamp quota or network warning (saved locally):", error?.message || error);
  }

  return newStamp;
};

export const deleteCustomStamp = async (id: string): Promise<boolean> => {
  try {
    const saved = localStorage.getItem('local_custom_stamps');
    if (saved) {
      const existing: CustomStamp[] = JSON.parse(saved);
      const filtered = existing.filter(s => s.id !== id);
      localStorage.setItem('local_custom_stamps', JSON.stringify(filtered));
    }
  } catch (e) {}

  try {
    await deleteDoc(doc(db, CUSTOM_STAMPS_COLLECTION, id));
  } catch (error: any) {
    console.warn("Firestore deleteCustomStamp warning:", error?.message || error);
  }
  return true;
};
