

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from './firebase';
import type { Fish, CatchLog } from './types';
import initialFishData from './data/initialFishData';
import Header from './components/Header';
import FishGrid from './components/FishGrid';
import FishDetailModal from './components/FishDetailModal';
import EncyclopediaProgress from './components/EncyclopediaProgress';
import Ranking from './components/Ranking';
import { useAuth } from './hooks/useAuth';
import firebase from 'firebase/compat/app';
import { albumOwnerUid, isFamilyConfigReady, isFamilyMember } from './familyConfig';

const LOCAL_STORAGE_KEY = 'my-family-fishing-encyclopedia';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const hasAccess = !!user && isFamilyMember(user.uid);
  const [fishes, setFishes] = useState<Fish[]>([]);
  const [selectedFishId, setSelectedFishId] = useState<number | null>(null);
  const [locations, setLocations] = useState<string[]>([]);
  const [anglers, setAnglers] = useState<string[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Data migration for first-time login
  useEffect(() => {
    const migrateData = async () => {
      if (!user || !hasAccess || user.uid !== albumOwnerUid) return;
  
      const userDocRef = db.collection('users').doc(albumOwnerUid);
      const settingsDocRef = db.collection('users').doc(albumOwnerUid).collection('settings').doc('main');
      const userDocSnap = await userDocRef.get();
  
      // If user document doesn't exist, it's their first time.
      if (!userDocSnap.exists) {
        console.log('First login for this user. Checking for local data to migrate...');
        const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            const localData = JSON.parse(saved);
            const batch = db.batch();

            // Set a flag to indicate migration is done
            batch.set(userDocRef, { migrated: true, email: user.email });

            // Migrate settings
            if (localData.locations || localData.anglers) {
              batch.set(settingsDocRef, { 
                locations: localData.locations || [], 
                anglers: localData.anglers || [] 
              });
            }

            // Migrate fish and catches
            if (localData.fishes && Array.isArray(localData.fishes)) {
              localData.fishes.forEach((fish: Fish) => {
                const fishDocRef = db.collection(`users/${albumOwnerUid}/fishes`).doc(String(fish.id));
                const { catches, ...fishData } = fish;
                batch.set(fishDocRef, fishData);
                if (catches && catches.length > 0) {
                    catches.forEach((c: any) => {
                        // This part is tricky as old local data used IndexedDB keys.
                        // We will just migrate the metadata, images will be lost from old local data.
                        const catchDocRef = fishDocRef.collection('catches').doc();
                        const { imageKey, dishImageKey, ...catchData } = c;
                        batch.set(catchDocRef, {
                            ...catchData,
                            imageUrl: fish.defaultImageUrl, // Fallback image
                            // dishImageUrl will be undefined
                        });
                    });
                }
              });
            }
            await batch.commit();
            console.log('Local data migration successful!');
            window.localStorage.removeItem(LOCAL_STORAGE_KEY);
          } catch (e) {
            console.error('Failed to migrate local data:', e);
             // Still set the user doc to prevent retrying a failed migration
            await userDocRef.set({ migrated: 'failed', email: user.email });
          }
        } else {
            // No local data, just mark the user as new.
             await userDocRef.set({ migrated: false, email: user.email });
        }
      }
    };
  
    if(user){
        migrateData();
    }
  }, [user, hasAccess]);
  
  // Subscribe to Firestore data
  useEffect(() => {
    if (!user || !hasAccess || !isFamilyConfigReady) {
      setFishes([]);
      setLocations([]);
      setAnglers([]);
      setIsDataLoaded(true);
      return;
    }
    
    setIsDataLoaded(false);
    const fishesColRef = db.collection('users').doc(albumOwnerUid).collection('fishes').orderBy('id');
    const unsubscribeFishes = fishesColRef.onSnapshot(async (querySnapshot) => {
      const fishesFromDb: Record<number, Fish> = {};
      
      for (const fishDoc of querySnapshot.docs) {
          const fishData = fishDoc.data();
          const fishId = parseInt(fishDoc.id, 10);
          fishesFromDb[fishId] = { ...(fishData as Omit<Fish, 'catches' | 'id'>), id: fishId, catches: [] };

          const catchesColRef = fishDoc.ref.collection('catches');
          const catchesSnapshot = await catchesColRef.get();
          fishesFromDb[fishId].catches = catchesSnapshot.docs.map(catchDoc => ({
              ...(catchDoc.data() as Omit<CatchLog, 'id'>),
              id: catchDoc.id,
          })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      
      const combinedFishes = initialFishData.map(initialFish => 
        fishesFromDb[initialFish.id] ? { ...initialFish, ...fishesFromDb[initialFish.id] } : initialFish
      );

      setFishes(combinedFishes);
      setIsDataLoaded(true);
    });

    const settingsDocRef = db.collection('users').doc(albumOwnerUid).collection('settings').doc('main');
    const unsubscribeSettings = settingsDocRef.onSnapshot((docSnap) => {
        if (docSnap.exists) {
            const settings = docSnap.data();
            setLocations(settings?.locations || []);
            setAnglers(settings?.anglers || ['パパ', 'ママ', 'お兄ちゃん', '妹']);
        } else {
            setLocations([]);
            setAnglers(['パパ', 'ママ', 'お兄ちゃん', '妹']);
        }
    });

    return () => {
      unsubscribeFishes();
      unsubscribeSettings();
    };
  }, [user, hasAccess]);

  const sortedFishes = useMemo(() => 
    [...fishes].sort((a, b) => {
      if (a.id === 999) return 1;
      if (b.id === 999) return -1;
      return a.name.localeCompare(b.name, 'ja');
    }), [fishes]);

  const selectedFish = useMemo(() => 
    selectedFishId ? fishes.find(f => f.id === selectedFishId) ?? null : null,
    [fishes, selectedFishId]
  );
  
  const handleSelectFish = useCallback((fish: Fish) => {
    setSelectedFishId(fish.id);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedFishId(null);
  }, []);
  
  const updateSettings = async (type: 'locations' | 'anglers', value: string) => {
    if (!user || !hasAccess) return;
    const settingsDocRef = db.collection('users').doc(albumOwnerUid).collection('settings').doc('main');
    const newItems = type === 'locations' ? [...locations, value] : [...anglers, value];
    await settingsDocRef.set({ [type]: newItems }, { merge: true });
  };

  const handleAddLocation = useCallback(async (newLocation: string) => {
    if (newLocation && !locations.includes(newLocation)) {
      await updateSettings('locations', newLocation);
    }
  }, [locations, user, hasAccess]);

  const handleAddAngler = useCallback(async (newAngler: string) => {
    if (newAngler && !anglers.includes(newAngler)) {
        await updateSettings('anglers', newAngler);
    }
  }, [anglers, user, hasAccess]);
  
  const handleAddCatch = useCallback(async (fishId: number, newCatch: Omit<CatchLog, 'id'>) => {
    if (!user || !hasAccess) throw new Error("このアカウントには編集権限がありません。");

    const fishDocRef = db.collection(`users/${albumOwnerUid}/fishes`).doc(String(fishId));

    // Use a transaction to atomically create the catch and potentially the parent fish document.
    // This is the most robust way to handle this operation and prevents race conditions or
    // partial data writes, which were likely the cause of the persistent save errors.
    return db.runTransaction(async (transaction) => {
        const fishDoc = await transaction.get(fishDocRef);
        
        // Create a new reference for the catch document within the transaction.
        const catchDocRef = fishDocRef.collection('catches').doc();
        
        // 1. Always create the new catch document.
        transaction.set(catchDocRef, newCatch);

        // 2. Check if the parent fish document exists.
        if (!fishDoc.exists) {
            // It doesn't exist, so create it for the first time.
            const initialFish = initialFishData.find((f) => f.id === fishId);
            if (!initialFish) {
                // This should not happen if fishId is valid.
                throw new Error(`Fish with ID ${fishId} is not defined.`);
            }
            const { catches, ...baseFishData } = initialFish;
            
            transaction.set(fishDocRef, {
                ...baseFishData,
                // Set the cover image to this first catch.
                coverImageCatchId: catchDocRef.id,
                // Add a timestamp.
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
        } else {
            // It exists, so just update it.
            const fishData = fishDoc.data();
            const updates: { [key: string]: any } = {
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
            // If for some reason the existing fish has no cover image, set this catch as the cover.
            if (!fishData?.coverImageCatchId) {
                updates.coverImageCatchId = catchDocRef.id;
            }
            transaction.update(fishDocRef, updates);
        }
    });
  }, [user, hasAccess]);

  const handleEditCatch = useCallback(async (fishId: number, updatedCatch: CatchLog) => {
    if (!user || !hasAccess) throw new Error("このアカウントには編集権限がありません。");

    const fishDocRef = db.collection(`users/${albumOwnerUid}/fishes`).doc(String(fishId));
    const catchDocRef = fishDocRef.collection('catches').doc(updatedCatch.id);
    const { id, ...catchData } = updatedCatch;

    const batch = db.batch();
    // Update the specific catch document
    batch.update(catchDocRef, catchData);
    // Touch the parent fish document to update its timestamp
    batch.update(fishDocRef, { updatedAt: firebase.firestore.FieldValue.serverTimestamp() });

    return batch.commit();
  }, [user, hasAccess]);

  const handleDeleteCatch = useCallback(async (fishId: number, catchId: string) => {
    if (!user || !hasAccess) throw new Error("このアカウントには編集権限がありません。");

    const fishDocRef = db.collection(`users/${albumOwnerUid}/fishes`).doc(String(fishId));
    const catchDocRef = fishDocRef.collection('catches').doc(catchId);
    
    // We need to read the fish data inside a transaction to avoid race conditions
    // when determining the new cover image.
    return db.runTransaction(async (transaction) => {
        const fishDoc = await transaction.get(fishDocRef);
        if (!fishDoc.exists) {
            // Fish doesn't exist, so nothing to delete from.
            return;
        }

        // 1. Delete the catch document.
        transaction.delete(catchDocRef);

        const fishData = fishDoc.data();
        let newCoverId: string | null = fishData?.coverImageCatchId ?? null;

        // 2. Check if the deleted catch was the cover image.
        if (fishData?.coverImageCatchId === catchId) {
            // It was the cover. We need to find a new one.
            // We must query the subcollection to find the most recent remaining catch.
            const catchesQuery = fishDoc.ref.collection('catches')
                .orderBy('date', 'desc')
                .limit(2); // Get up to 2 latest catches

            const catchesSnapshot = await catchesQuery.get();
            const remainingCatches = catchesSnapshot.docs.filter(doc => doc.id !== catchId);
            
            newCoverId = remainingCatches.length > 0 ? remainingCatches[0].id : null;
        }

        // 3. Update the parent fish document.
        transaction.update(fishDocRef, { 
            coverImageCatchId: newCoverId,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    });
  }, [user, hasAccess]);

  const handleSetCoverImage = useCallback(async (fishId: number, catchId: string) => {
    if (!user || !hasAccess) throw new Error("このアカウントには編集権限がありません。");
    const fishDocRef = db.collection(`users/${albumOwnerUid}/fishes`).doc(String(fishId));
    return fishDocRef.update({
        coverImageCatchId: catchId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }, [user, hasAccess]);
  
  if (loading || (user && hasAccess && !isDataLoaded)) {
    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center">
            <div className="text-center">
                <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-lg font-semibold text-gray-700">データを読み込んでいます...</p>
            </div>
        </div>
    );
  }

  if (!isFamilyConfigReady) {
    return (
      <div className="min-h-screen bg-blue-50 text-gray-800">
        <Header />
        <main className="container mx-auto p-4 md:p-8">
          <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-red-700 mb-2">家族共有の設定が未完了です</h2>
            <p className="text-gray-700">Netlify に VITE_FAMILY_ALBUM_OWNER_UID を設定してください。</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-blue-50 text-gray-800">
        <Header />
        <main className="container mx-auto p-4 md:p-8">
          <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-bold text-blue-700 mb-2">家族専用の釣りアルバムです</h2>
            <p className="text-gray-700">右上の「ログイン」から、登録済みの家族のGoogleアカウントでログインしてください。</p>
          </div>
        </main>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-blue-50 text-gray-800">
        <Header />
        <main className="container mx-auto p-4 md:p-8">
          <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">このアカウントは登録されていません</h2>
            <p className="text-gray-700">家族として登録したGoogleアカウントでログインし直してください。</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 text-gray-800">
      <Header />
      <main className="container mx-auto p-4 md:p-8">

        <EncyclopediaProgress 
          fishes={fishes} 
        />
        <div className="my-6 md:my-8">
          <Ranking fishes={fishes} />
        </div>
        <FishGrid fishes={sortedFishes} onSelectFish={handleSelectFish} />
      </main>
      
      {selectedFish && (
        <FishDetailModal
          fish={selectedFish}
          onClose={handleCloseModal}
          onAddCatch={handleAddCatch}
          onEditCatch={handleEditCatch}
          onDeleteCatch={handleDeleteCatch}
          onSetCoverImage={handleSetCoverImage}
          locations={locations}
          onAddLocation={handleAddLocation}
          anglers={anglers}
          onAddAngler={handleAddAngler}
          isLoggedIn={hasAccess}
        />
      )}
    </div>
  );
};

export default App;
