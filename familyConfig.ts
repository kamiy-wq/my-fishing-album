const env = (import.meta as any).env;

export const albumOwnerUid = String(env.VITE_FAMILY_ALBUM_OWNER_UID || '').trim();

const additionalFamilyUids = String(env.VITE_FAMILY_MEMBER_UIDS || '')
  .split(',')
  .map((uid: string) => uid.trim())
  .filter(Boolean);

export const allowedFamilyUids = new Set(
  [albumOwnerUid, ...additionalFamilyUids].filter(Boolean)
);

export const isFamilyConfigReady = albumOwnerUid.length > 0;

export const isFamilyMember = (uid?: string | null): boolean =>
  !!uid && isFamilyConfigReady && allowedFamilyUids.has(uid);
