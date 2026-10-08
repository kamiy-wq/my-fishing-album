import React, { useMemo, useState } from 'react';
import { getBlob, ref as modularStorageRef } from 'firebase/storage';
import firebase from 'firebase/compat/app';
import type { Fish } from '../types';
import { db, secureStorage, storage } from '../firebase';
import { albumOwnerUid } from '../familyConfig';
import { extractStoragePath, isFirebaseDownloadUrl, toStorageValue } from '../storageImages';
import { useAuth } from '../hooks/useAuth';

interface PhotoSecurityMigrationProps {
  fishes: Fish[];
}

const PhotoSecurityMigration: React.FC<PhotoSecurityMigrationProps> = ({ fishes }) => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const itemsToProcess = useMemo(() => {
    let count = 0;

    fishes.forEach((fish) => {
      fish.catches.forEach((catchLog) => {
        if (isFirebaseDownloadUrl(catchLog.imageUrl)) count += 1;
        if (isFirebaseDownloadUrl(catchLog.dishImageUrl)) count += 1;
        count += catchLog.legacyStorageCleanup?.length || 0;
      });
    });

    return count;
  }, [fishes]);

  if (!user || user.uid !== albumOwnerUid || itemsToProcess === 0) {
    return null;
  }

  const getPendingCleanup = async (catchDocRef: firebase.firestore.DocumentReference): Promise<string[]> => {
    const latest = await catchDocRef.get();
    return latest.data()?.legacyStorageCleanup || [];
  };

  const savePendingCleanup = async (
    catchDocRef: firebase.firestore.DocumentReference,
    paths: string[],
  ) => {
    const uniquePaths = Array.from(new Set(paths));

    if (uniquePaths.length === 0) {
      await catchDocRef.update({
        legacyStorageCleanup: firebase.firestore.FieldValue.delete(),
      });
      return;
    }

    await catchDocRef.update({
      legacyStorageCleanup: uniquePaths,
    });
  };

  const deleteLegacyPath = async (
    catchDocRef: firebase.firestore.DocumentReference,
    path: string,
  ) => {
    try {
      await storage.ref(path).delete();
    } catch (deleteError: any) {
      if (deleteError?.code !== 'storage/object-not-found') {
        throw deleteError;
      }
    }

    const pending = await getPendingCleanup(catchDocRef);
    await savePendingCleanup(catchDocRef, pending.filter((item) => item !== path));
  };

  const migrateImageField = async (
    catchDocRef: firebase.firestore.DocumentReference,
    source: string,
    field: 'imageUrl' | 'dishImageUrl',
    folder: 'catches' | 'dishes',
  ) => {
    const oldPath = extractStoragePath(source);
    if (!oldPath) return;

    const blob = await getBlob(modularStorageRef(secureStorage, oldPath));
    const originalName = oldPath.split('/').pop() || 'photo';
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const randomId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

    const newPath =
      `users/${albumOwnerUid}/private/${folder}/${Date.now()}-${randomId}-${safeName}`;

    const newRef = storage.ref(newPath);
    await newRef.put(blob, { contentType: blob.type || undefined });

    const pending = await getPendingCleanup(catchDocRef);
    await catchDocRef.update({
      [field]: toStorageValue(newRef.fullPath),
      legacyStorageCleanup: Array.from(new Set([...pending, oldPath])),
    });

    await deleteLegacyPath(catchDocRef, oldPath);
  };

  const runMigration = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setError(null);

    try {
      let completed = 0;

      for (const fish of fishes) {
        for (const catchLog of fish.catches) {
          const catchDocRef = db
            .collection(`users/${albumOwnerUid}/fishes/${fish.id}/catches`)
            .doc(catchLog.id);

          const pendingCleanup = [...(catchLog.legacyStorageCleanup || [])];

          for (const path of pendingCleanup) {
            setStatus(`古い共有URLを無効化しています… ${completed + 1}/${itemsToProcess}`);
            await deleteLegacyPath(catchDocRef, path);
            completed += 1;
          }

          if (isFirebaseDownloadUrl(catchLog.imageUrl)) {
            setStatus(`魚の写真を保護形式へ移行しています… ${completed + 1}/${itemsToProcess}`);
            await migrateImageField(catchDocRef, catchLog.imageUrl, 'imageUrl', 'catches');
            completed += 1;
          }

          if (catchLog.dishImageUrl && isFirebaseDownloadUrl(catchLog.dishImageUrl)) {
            setStatus(`料理写真を保護形式へ移行しています… ${completed + 1}/${itemsToProcess}`);
            await migrateImageField(catchDocRef, catchLog.dishImageUrl, 'dishImageUrl', 'dishes');
            completed += 1;
          }
        }
      }

      setStatus('既存写真の保護が完了しました。');
    } catch (migrationError) {
      console.error('Photo security migration failed:', migrationError);
      setError(
        '写真の保護処理を完了できませんでした。Cloud Storage の CORS 設定を確認してから、もう一度実行してください。',
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 shadow-sm">
      <h2 className="font-bold text-amber-900">既存写真のセキュリティ更新</h2>
      <p className="mt-1 text-sm text-amber-800">
        以前の長期共有URLが残っている写真が {itemsToProcess} 件あります。
        保護形式へ移行すると、家族としてログインした端末だけが写真を読み込む方式になります。
      </p>
      <button
        type="button"
        onClick={runMigration}
        disabled={isRunning}
        className="mt-3 rounded-md bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700 disabled:cursor-wait disabled:bg-amber-300"
      >
        {isRunning ? '処理中…' : '既存写真を保護する'}
      </button>
      {status && <p className="mt-2 text-sm text-amber-900">{status}</p>}
      {error && <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
};

export default PhotoSecurityMigration;
