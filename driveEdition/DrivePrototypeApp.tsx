import React, { useEffect, useMemo, useState } from 'react';
import { createNewDriveAlbum } from './albumRepository';
import {
  createJsonFile,
  downloadDriveFile,
  downloadJsonFile,
  listDriveFilesInFolder,
  requestDriveAccess,
  uploadPhoto,
} from './googleDriveClient';
import {
  DRIVE_ALBUM_SCHEMA_VERSION,
  type DriveAlbumManifest,
  type DriveCatchRecord,
} from './schema';

const MANIFEST_ID_KEY = 'drive-product-prototype-manifest-id';

interface LoadedCatch extends DriveCatchRecord {
  photoUrl?: string;
}

const makeCatchId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `catch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const DrivePrototypeApp: React.FC = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';
  const [accessToken, setAccessToken] = useState('');
  const [manifest, setManifest] = useState<DriveAlbumManifest | null>(null);
  const [manifestFileId, setManifestFileId] = useState(
    () => window.localStorage.getItem(MANIFEST_ID_KEY) || '',
  );
  const [albumTitle, setAlbumTitle] = useState('我が家の釣り図鑑');
  const [fishName, setFishName] = useState('アコウ');
  const [catchDate, setCatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState('');
  const [size, setSize] = useState('');
  const [angler, setAngler] = useState('パパ');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [loadedCatches, setLoadedCatches] = useState<LoadedCatch[]>([]);
  const [status, setStatus] = useState('Firebase本番には触れない、Google Drive版の独立試作です。');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const configured = useMemo(() => clientId.length > 0 && !clientId.startsWith('your-'), [clientId]);

  useEffect(() => {
    return () => {
      loadedCatches.forEach((item) => {
        if (item.photoUrl) URL.revokeObjectURL(item.photoUrl);
      });
    };
  }, [loadedCatches]);

  const run = async (label: string, task: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setStatus(label);
    try {
      await task();
    } catch (taskError) {
      console.error(taskError);
      setError(taskError instanceof Error ? taskError.message : String(taskError));
      setStatus('処理を中断しました。');
    } finally {
      setBusy(false);
    }
  };

  const connectDrive = () =>
    run('Google Driveへのアクセス許可を確認しています…', async () => {
      if (!configured) {
        throw new Error('VITE_GOOGLE_CLIENT_ID が未設定です。');
      }
      const token = await requestDriveAccess(clientId);
      setAccessToken(token);
      setStatus('Google Driveに接続しました。データはこのブラウザではなく、あなたのDriveへ保存します。');

      if (manifestFileId) {
        const savedManifest = await downloadJsonFile<DriveAlbumManifest>(token, manifestFileId);
        setManifest(savedManifest);
        setAlbumTitle(savedManifest.title);
        setStatus('Google Driveに接続し、前回の試作アルバムを読み込みました。');
      }
    });

  const createAlbum = () =>
    run('Google Driveに試作アルバムを作成しています…', async () => {
      if (!accessToken) throw new Error('先にGoogle Driveへ接続してください。');
      const created = await createNewDriveAlbum(accessToken, albumTitle.trim() || '我が家の釣り図鑑');
      setManifest(created.manifest);
      setManifestFileId(created.manifestFile.id);
      window.localStorage.setItem(MANIFEST_ID_KEY, created.manifestFile.id);
      setLoadedCatches([]);
      setStatus('作成完了。Google Driveに album.json / data / photos が作成されました。');
    });

  const saveTestCatch = () =>
    run('釣果データと写真をあなたのGoogle Driveへ保存しています…', async () => {
      if (!accessToken || !manifest) throw new Error('Driveへ接続し、アルバムを作成してください。');
      if (!fishName.trim()) throw new Error('魚名を入力してください。');

      const id = makeCatchId();
      let catchPhotoFileId: string | undefined;

      if (photo) {
        const extension = photo.name.includes('.') ? photo.name.split('.').pop() : 'jpg';
        const uploaded = await uploadPhoto(
          accessToken,
          manifest.catchPhotosFolderId,
          photo,
          `${id}.${extension || 'jpg'}`,
        );
        catchPhotoFileId = uploaded.id;
      }

      const now = new Date().toISOString();
      const record: DriveCatchRecord = {
        schemaVersion: DRIVE_ALBUM_SCHEMA_VERSION,
        id,
        fishId: 0,
        fishName: fishName.trim(),
        date: catchDate,
        location: location.trim(),
        size: size.trim() || undefined,
        angler: angler.trim() || '未設定',
        notes: notes.trim() || undefined,
        catchPhotoFileId,
        createdAt: now,
        updatedAt: now,
      };

      await createJsonFile(
        accessToken,
        `${id}.json`,
        manifest.catchesFolderId,
        record,
      );

      setStatus('保存完了。釣果JSONと写真はあなたのGoogle Driveにあります。');
      await loadFromDrive(accessToken, manifest);
    });

  const loadFromDrive = async (
    token = accessToken,
    targetManifest = manifest,
  ): Promise<void> => {
    if (!token || !targetManifest) throw new Error('Driveへ接続し、アルバムを選択してください。');

    const files = await listDriveFilesInFolder(token, targetManifest.catchesFolderId);
    const jsonFiles = files.filter((file) => file.name.endsWith('.json'));

    const previousUrls = loadedCatches.map((item) => item.photoUrl).filter(Boolean) as string[];
    const next: LoadedCatch[] = [];

    for (const file of jsonFiles) {
      const record = await downloadJsonFile<DriveCatchRecord>(token, file.id);
      let photoUrl: string | undefined;
      if (record.catchPhotoFileId) {
        const blob = await downloadDriveFile(token, record.catchPhotoFileId);
        photoUrl = URL.createObjectURL(blob);
      }
      next.push({ ...record, photoUrl });
    }

    previousUrls.forEach((url) => URL.revokeObjectURL(url));
    setLoadedCatches(next);
  };

  const reload = () =>
    run('Google Driveから保存済みデータを読み直しています…', async () => {
      let target = manifest;
      if (!target && manifestFileId) {
        target = await downloadJsonFile<DriveAlbumManifest>(accessToken, manifestFileId);
        setManifest(target);
      }
      if (!target) throw new Error('アルバム情報がありません。');
      await loadFromDrive(accessToken, target);
      setStatus('Driveから再読み込みしました。ブラウザ内のデータではなく、Drive上のJSONを表示しています。');
    });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-blue-700 text-white shadow">
        <div className="mx-auto max-w-4xl px-4 py-5">
          <p className="text-xs font-bold tracking-wider text-blue-200">GOOGLE DRIVE PRODUCT PROTOTYPE</p>
          <h1 className="mt-1 text-2xl font-bold">家族でつくる釣り図鑑 — Drive版試作</h1>
          <p className="mt-1 text-sm text-blue-100">写真・コメント・釣果データを利用者自身のGoogle Driveへ保存する実験版です。</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 p-4 py-6">
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-bold text-emerald-900">現行アルバムは変更しません</p>
          <p className="mt-1 text-sm text-emerald-800">
            この画面は <code>drive-product-prototype</code> ブランチ専用です。Firebase本番データへの読み書き処理はありません。
          </p>
        </section>

        {!configured && (
          <section className="rounded-xl border border-amber-300 bg-amber-50 p-4">
            <p className="font-bold text-amber-900">Google OAuth Client IDの設定待ちです</p>
            <p className="mt-1 text-sm text-amber-800">
              Netlifyの試作サイトに <code>VITE_GOOGLE_CLIENT_ID</code> を設定すると接続テストできます。
            </p>
          </section>
        )}

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold">1. Google Driveへ接続</h2>
          <button
            type="button"
            onClick={connectDrive}
            disabled={busy || !configured}
            className="mt-3 min-h-12 rounded-lg bg-blue-600 px-5 py-2 font-bold text-white disabled:bg-slate-300"
          >
            {accessToken ? 'Driveに再接続' : 'Google Driveに接続'}
          </button>
          <p className="mt-2 text-xs text-slate-500">使用スコープ: drive.file（アプリが作成・選択したファイルのみ）</p>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold">2. 自分のDriveにアルバムを作成</h2>
          <label className="mt-3 block text-sm font-semibold">アルバム名</label>
          <input
            value={albumTitle}
            onChange={(event) => setAlbumTitle(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <button
            type="button"
            onClick={createAlbum}
            disabled={busy || !accessToken}
            className="mt-3 min-h-12 rounded-lg bg-emerald-600 px-5 py-2 font-bold text-white disabled:bg-slate-300"
          >
            新しい試作アルバムを作る
          </button>
          {manifest && (
            <p className="mt-3 break-all rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              Drive root folder ID: {manifest.rootFolderId}
            </p>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold">3. 釣果1件＋写真をDriveへ保存</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">魚名
              <input value={fishName} onChange={(e) => setFishName(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
            </label>
            <label className="text-sm font-semibold">日付
              <input type="date" value={catchDate} onChange={(e) => setCatchDate(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
            </label>
            <label className="text-sm font-semibold">場所
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
            </label>
            <label className="text-sm font-semibold">サイズ
              <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="例: 39cm" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
            </label>
            <label className="text-sm font-semibold">釣った人
              <input value={angler} onChange={(e) => setAngler(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
            </label>
            <label className="text-sm font-semibold">写真
              <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm font-normal" />
            </label>
          </div>
          <label className="mt-3 block text-sm font-semibold">コメント
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
          </label>
          <button
            type="button"
            onClick={saveTestCatch}
            disabled={busy || !manifest || !accessToken}
            className="mt-3 min-h-12 rounded-lg bg-indigo-600 px-5 py-2 font-bold text-white disabled:bg-slate-300"
          >
            Driveへ保存する
          </button>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">4. Driveから再読み込み</h2>
              <p className="text-sm text-slate-500">保存したJSONと写真をGoogle Driveから取り直して表示します。</p>
            </div>
            <button
              type="button"
              onClick={reload}
              disabled={busy || !accessToken || (!manifest && !manifestFileId)}
              className="min-h-11 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 font-bold text-blue-700 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              Driveから読み直す
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {loadedCatches.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200">
                {item.photoUrl && (
                  <img src={item.photoUrl} alt={item.fishName} className="h-56 w-full bg-slate-100 object-contain" />
                )}
                <div className="p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-bold">{item.fishName}</h3>
                    <span className="text-xs text-slate-500">{item.date}</span>
                  </div>
                  <p className="mt-1 text-sm">{[item.size, item.location].filter(Boolean).join('・')}</p>
                  {item.notes && <p className="mt-2 text-sm text-slate-600">{item.notes}</p>}
                </div>
              </article>
            ))}
            {loadedCatches.length === 0 && (
              <p className="text-sm text-slate-500">まだDriveから読み込んだ釣果はありません。</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-100 p-4">
          <p className="text-sm font-semibold">{busy ? '処理中: ' : ''}{status}</p>
          {error && <p className="mt-2 break-words text-sm font-bold text-red-600">{error}</p>}
        </section>
      </main>
    </div>
  );
};

export default DrivePrototypeApp;
