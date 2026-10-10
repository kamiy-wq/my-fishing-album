import {
  createDriveFolder,
  createJsonFile,
  type DriveFileMetadata,
} from './googleDriveClient';
import {
  DRIVE_ALBUM_SCHEMA_VERSION,
  type DriveAlbumManifest,
  type DriveAlbumSettings,
} from './schema';

export interface CreatedDriveAlbum {
  rootFolder: DriveFileMetadata;
  manifestFile: DriveFileMetadata;
  settingsFile: DriveFileMetadata;
  manifest: DriveAlbumManifest;
}

const isoNow = (): string => new Date().toISOString();

const makeAlbumId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `album-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const createNewDriveAlbum = async (
  accessToken: string,
  title = '我が家の釣り図鑑',
): Promise<CreatedDriveAlbum> => {
  const rootFolder = await createDriveFolder(accessToken, title);
  const dataFolder = await createDriveFolder(accessToken, 'data', rootFolder.id);
  const catchesFolder = await createDriveFolder(accessToken, 'catches', dataFolder.id);
  const photosFolder = await createDriveFolder(accessToken, 'photos', rootFolder.id);
  const catchPhotosFolder = await createDriveFolder(accessToken, 'catches', photosFolder.id);
  const dishPhotosFolder = await createDriveFolder(accessToken, 'dishes', photosFolder.id);

  const settings: DriveAlbumSettings = {
    schemaVersion: DRIVE_ALBUM_SCHEMA_VERSION,
    locations: [],
    anglers: ['パパ', 'ママ', 'お兄ちゃん', '妹'],
    updatedAt: isoNow(),
  };

  const settingsFile = await createJsonFile(
    accessToken,
    'settings.json',
    dataFolder.id,
    settings,
  );

  const now = isoNow();
  const manifest: DriveAlbumManifest = {
    schemaVersion: DRIVE_ALBUM_SCHEMA_VERSION,
    albumId: makeAlbumId(),
    title,
    rootFolderId: rootFolder.id,
    createdAt: now,
    updatedAt: now,
    settingsFileId: settingsFile.id,
    dataFolderId: dataFolder.id,
    catchesFolderId: catchesFolder.id,
    photosFolderId: photosFolder.id,
    catchPhotosFolderId: catchPhotosFolder.id,
    dishPhotosFolderId: dishPhotosFolder.id,
  };

  const manifestFile = await createJsonFile(
    accessToken,
    'album.json',
    rootFolder.id,
    manifest,
  );

  return {
    rootFolder,
    manifestFile,
    settingsFile,
    manifest,
  };
};
