export const DRIVE_ALBUM_SCHEMA_VERSION = 1;

export interface DriveAlbumManifest {
  schemaVersion: number;
  albumId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  settingsFileId?: string;
  dataFolderId: string;
  catchesFolderId: string;
  photosFolderId: string;
  catchPhotosFolderId: string;
  dishPhotosFolderId: string;
}

export interface DriveAlbumSettings {
  schemaVersion: number;
  locations: string[];
  anglers: string[];
  updatedAt: string;
}

export interface DriveCatchRecord {
  schemaVersion: number;
  id: string;
  fishId: number;
  fishName: string;
  date: string;
  location: string;
  size?: string;
  angler: string;
  notes?: string;
  tasteRating?: number;
  dishNotes?: string;
  catchPhotoFileId?: string;
  dishPhotoFileId?: string;
  isCoverPhoto?: boolean;
  createdAt: string;
  updatedAt: string;
}
