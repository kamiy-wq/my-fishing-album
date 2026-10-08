export const STORAGE_VALUE_PREFIX = 'storage://';

export const toStorageValue = (path: string): string =>
  `${STORAGE_VALUE_PREFIX}${path}`;

export const isFirebaseDownloadUrl = (value?: string | null): boolean => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.hostname === 'firebasestorage.googleapis.com' && url.pathname.includes('/o/');
  } catch {
    return false;
  }
};

export const extractStoragePath = (value?: string | null): string | null => {
  if (!value) return null;

  if (value.startsWith(STORAGE_VALUE_PREFIX)) {
    const path = value.slice(STORAGE_VALUE_PREFIX.length);
    return path || null;
  }

  if (isFirebaseDownloadUrl(value)) {
    try {
      const url = new URL(value);
      const marker = '/o/';
      const index = url.pathname.indexOf(marker);
      if (index === -1) return null;
      return decodeURIComponent(url.pathname.slice(index + marker.length));
    } catch {
      return null;
    }
  }

  return null;
};
