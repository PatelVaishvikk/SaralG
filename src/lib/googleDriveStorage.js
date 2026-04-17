import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

function getAuthClient() {
  const credPath = path.join(process.cwd(), '.google-credentials.json');
  if (!fs.existsSync(credPath)) {
    console.warn('Google Drive credentials file not found.');
    return null;
  }

  const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

export async function uploadToGoogleDrive(fileBuffer, originalFilename) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const authInstance = getAuthClient();

  if (!authInstance || !folderId) {
    console.warn('Google Drive not configured. Skipping image upload.');
    return null;
  }

  const auth = await authInstance.getClient();
  const drive = google.drive({ version: 'v3', auth });

  const timestamp = Date.now();
  const ext = originalFilename.split('.').pop() || 'png';
  const fileName = `rsvp-${timestamp}-${Math.random().toString(36).substring(2, 6)}.${ext}`;

  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const response = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      body: stream,
    },
    fields: 'id',
  });

  const fileId = response.data.id;

  await drive.permissions.create({
    fileId,
    supportsAllDrives: true,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
}
