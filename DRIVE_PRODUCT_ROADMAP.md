# Google Drive product edition roadmap

This branch is an isolated prototype for a future sellable edition of the fishing album.

**Important:** the current Firebase production app remains on `main` and is not changed by this branch.

## Target architecture

- App code: hosted as a web/PWA and updated centrally.
- User sign-in / Drive authorization: Google Identity Services OAuth 2.0.
- User data: stored only in the user's own Google Drive.
- Photos: stored only in the user's own Google Drive.
- Firebase Authentication: not used.
- Firestore: not used.
- Firebase Storage: not used.

The requested OAuth scope is:

`https://www.googleapis.com/auth/drive.file`

This limits the app to files it creates or files the user explicitly opens/selects for the app.

## Drive folder layout

```
My Fishing Album/
├── album.json
├── data/
│   ├── settings.json
│   └── catches/
│       ├── <catch-id>.json
│       └── ...
└── photos/
    ├── catches/
    │   ├── <catch-id>.<ext>
    │   └── ...
    └── dishes/
        ├── <catch-id>.<ext>
        └── ...
```

One catch is one JSON file. This reduces overwrite conflicts when family members add or edit different catches.

## Data ownership principle

The service provider stores no album photos, comments, locations, catch records, or ratings.
The user's Google Drive owns all album content.

The web app may later have a separate licensing system, but licensing data must not contain album content.

## Milestones

1. Drive API foundation
   - Google OAuth token flow
   - create/open album folder
   - create/update/read JSON
   - upload/download photos

2. Proof of concept
   - create a new Drive album
   - save one catch and one photo
   - reload and restore them

3. Replace Firebase data layer
   - list catches from Drive
   - add/edit/delete catch records
   - settings and cover-photo behavior
   - family shared-folder support

4. Product hardening
   - Google Picker for opening an existing/shared album
   - conflict handling
   - offline/cache behavior
   - backup/export ZIP
   - schema migrations
   - privacy policy / terms
   - licensing / purchase flow

5. Migration tool
   - export the current Firebase album
   - import to the user's Drive edition
   - verify counts and photos before any old data is removed

## Production isolation

Do not merge this branch into `main`.
When the Drive edition is ready for testing, deploy this branch as a separate Netlify site/domain.

## Deploy Preview environment

For the prototype, `VITE_GOOGLE_CLIENT_ID` is intentionally configured only for Netlify Deploy Previews. Production remains empty so the current Firebase app is unaffected.
