# Family-only album setup

This branch changes the app so approved family accounts share the album stored under one owner UID.

## Netlify environment variables

Add these variables in Netlify and redeploy:

- `VITE_FAMILY_ALBUM_OWNER_UID`: the UID of the account that currently owns the album data.
- `VITE_FAMILY_MEMBER_UIDS`: comma-separated UIDs for the other family members.

Example (use real UIDs in Netlify, not in GitHub):

```
VITE_FAMILY_ALBUM_OWNER_UID=<OWNER_UID>
VITE_FAMILY_MEMBER_UIDS=<FAMILY_UID_1>,<FAMILY_UID_2>
```

## Firestore rules

Replace the placeholders before publishing:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isFamily() {
      return request.auth != null
        && request.auth.uid in [
          "<OWNER_UID>",
          "<FAMILY_UID_1>"
        ];
    }

    match /users/{userId}/{document=**} {
      allow read, write: if userId == "<OWNER_UID>" && isFamily();
    }
  }
}
```

Add more family UIDs to the array if needed.

## Storage rules

Replace the placeholders before publishing:

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    function isFamily() {
      return request.auth != null
        && request.auth.uid in [
          "<OWNER_UID>",
          "<FAMILY_UID_1>"
        ];
    }

    match /users/{userId}/{allPaths=**} {
      allow read, write: if userId == "<OWNER_UID>" && isFamily();
    }
  }
}
```

## Important

Do not merge this branch into `main` until the Netlify variables and Firebase rules are ready. If merged without the owner UID variable, the app intentionally shows a setup-incomplete screen instead of exposing album content.

Firebase Storage download URLs already stored in Firestore include download tokens. The app-level and Firebase-rule access is family-only after this setup, but anyone who somehow obtains one of those exact tokenized image URLs can still open that individual image. Removing tokenized URLs entirely would require a separate storage-path migration.
