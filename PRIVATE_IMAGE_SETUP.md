# Private image loading setup

This change removes long-lived Firebase download URLs from normal album use.

## Why

`getDownloadURL()` creates a long-lived, revocable token URL. If that exact URL is copied or leaked, the individual file can be opened without going through the app's normal signed-in flow.

The new implementation:

- stores Storage paths such as `storage://users/<owner>/private/catches/...`
- downloads photo bytes with Firebase Storage `getBlob()`
- therefore applies Firebase Authentication + Storage Security Rules to each normal photo read
- provides an owner-only one-time migration button for existing tokenized photo URLs
- migrates old files to new private paths and deletes the old objects, invalidating the old URLs

## Required Cloud Storage CORS setting before merge

Bucket:

`my-fishing-album.firebasestorage.app`

In Google Cloud Console:

Cloud Storage -> Buckets -> my-fishing-album.firebasestorage.app -> Configuration ->
Cross-origin resource sharing -> Edit CORS configuration.

Add:

- Allowed origin: `https://my-fishing-album.netlify.app`
- Method: `GET`
- Response header: `Content-Type`
- Max age: `3600`

CORS only allows the browser to make the cross-origin request. Firebase Storage Security Rules still decide whether the signed-in user is authorized.

Do not merge this branch until CORS is configured, because protected photos are loaded with `getBlob()`.

## After deployment

1. Sign in as the album owner.
2. Confirm existing photos display.
3. Use the "既存写真を保護する" button.
4. Wait until the migration finishes.
5. Refresh and confirm the migration banner is gone.
6. Sign out and confirm the album is unavailable.
7. Sign in as a family member and confirm photos display.

New photos no longer write long-lived download URLs into Firestore.
