const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

export const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  callback: (response: GoogleTokenResponse) => void;
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface GoogleAccountsOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
  }) => GoogleTokenClient;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleAccountsOAuth2;
      };
    };
  }
}

export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType?: string;
  parents?: string[];
  modifiedTime?: string;
}

const authHeaders = (accessToken: string): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
});

const parseJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Drive API error ${response.status}: ${body}`);
  }
  return response.json() as Promise<T>;
};

export const requestDriveAccess = async (clientId: string): Promise<string> => {
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error('Google Identity Services is not loaded.');
  }

  return new Promise<string>((resolve, reject) => {
    const tokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_FILE_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || response.error || 'Google authorization failed.'));
          return;
        }
        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

export const createDriveFolder = async (
  accessToken: string,
  name: string,
  parentId?: string,
): Promise<DriveFileMetadata> => {
  const body: Record<string, unknown> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) body.parents = [parentId];

  const response = await fetch(`${DRIVE_API}/files?fields=id,name,mimeType,parents`, {
    method: 'POST',
    headers: {
      ...authHeaders(accessToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseJson<DriveFileMetadata>(response);
};

export const createJsonFile = async (
  accessToken: string,
  name: string,
  parentId: string,
  value: unknown,
): Promise<DriveFileMetadata> => {
  const boundary = `drive-boundary-${Date.now()}`;
  const metadata = {
    name,
    parents: [parentId],
    mimeType: 'application/json',
  };
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(value, null, 2),
    `\r\n--${boundary}--`,
  ]);

  const response = await fetch(
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,mimeType,parents`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(accessToken),
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  return parseJson<DriveFileMetadata>(response);
};

export const updateJsonFile = async (
  accessToken: string,
  fileId: string,
  value: unknown,
): Promise<void> => {
  const response = await fetch(
    `${DRIVE_UPLOAD_API}/files/${encodeURIComponent(fileId)}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        ...authHeaders(accessToken),
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(value, null, 2),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Drive API error ${response.status}: ${body}`);
  }
};

export const downloadDriveFile = async (
  accessToken: string,
  fileId: string,
): Promise<Blob> => {
  const response = await fetch(
    `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: authHeaders(accessToken) },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Drive API error ${response.status}: ${body}`);
  }

  return response.blob();
};

export const downloadJsonFile = async <T>(
  accessToken: string,
  fileId: string,
): Promise<T> => {
  const blob = await downloadDriveFile(accessToken, fileId);
  return JSON.parse(await blob.text()) as T;
};

export const uploadPhoto = async (
  accessToken: string,
  parentId: string,
  file: File,
  storedName: string,
): Promise<DriveFileMetadata> => {
  const boundary = `drive-boundary-${Date.now()}`;
  const metadata = {
    name: storedName,
    parents: [parentId],
  };
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
    file,
    `\r\n--${boundary}--`,
  ]);

  const response = await fetch(
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,mimeType,parents`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(accessToken),
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  return parseJson<DriveFileMetadata>(response);
};

export const deleteDriveFile = async (
  accessToken: string,
  fileId: string,
): Promise<void> => {
  const response = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  });

  if (!response.ok && response.status !== 404) {
    const body = await response.text();
    throw new Error(`Google Drive API error ${response.status}: ${body}`);
  }
};
