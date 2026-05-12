import cors from '@fastify/cors';
import multipart, { type MultipartFile, type MultipartValue } from '@fastify/multipart';
import Fastify from 'fastify';
import { google } from 'googleapis';
import { Readable } from 'node:stream';

const rawPort = Number(process.env.PORT || 8080);
const port = Number.isFinite(rawPort) ? rawPort : 8080;
const driveFolderId = process.env.DRIVE_FOLDER_ID?.trim() ?? '';
const maxFileBytes = Number(process.env.MAX_FILE_BYTES || 5 * 1024 * 1024 * 1024);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const turkishCharacterMap: Record<string, string> = {
  ç: 'c',
  Ç: 'C',
  ğ: 'g',
  Ğ: 'G',
  ı: 'i',
  İ: 'I',
  ö: 'o',
  Ö: 'O',
  ş: 's',
  Ş: 'S',
  ü: 'u',
  Ü: 'U',
};

function sanitizeName(value: unknown, fallback = 'misafir') {
  const normalized = String(value || fallback)
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (character) => turkishCharacterMap[character] ?? character)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 140);

  return normalized || fallback;
}

function normalizeFileIndex(value: unknown) {
  const parsed = Number.parseInt(String(value || '1'), 10);
  const safeIndex = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  return String(safeIndex).padStart(3, '0');
}

function buildSavedFileName(
  guestName: string,
  fileIndex: string,
  uploadGroupId: string,
  originalFileName: string,
) {
  const dotIndex = originalFileName.lastIndexOf('.');

  if (dotIndex <= 0) {
    return `${guestName}_${fileIndex}_${originalFileName}_${uploadGroupId}`;
  }

  const baseName = originalFileName.slice(0, dotIndex);
  const extension = originalFileName.slice(dotIndex);
  return `${guestName}_${fileIndex}_${baseName}_${uploadGroupId}${extension}`;
}

function getServiceAccountCredentials() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();

  if (json) {
    return JSON.parse(json) as Record<string, unknown>;
  }

  const filePath = process.env.GOOGLE_SERVICE_ACCOUNT_FILE?.trim();
  if (filePath) {
    return filePath;
  }

  throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON veya GOOGLE_SERVICE_ACCOUNT_FILE ayarlanmamış.');
}

function getDriveClient() {
  const oauthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const oauthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const oauthRefreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();

  if (oauthClientId && oauthClientSecret && oauthRefreshToken) {
    const auth = new google.auth.OAuth2(oauthClientId, oauthClientSecret);
    auth.setCredentials({
      refresh_token: oauthRefreshToken,
    });

    return google.drive({ version: 'v3', auth });
  }

  const credentials = getServiceAccountCredentials();
  const auth =
    typeof credentials === 'string'
      ? new google.auth.GoogleAuth({
          keyFile: credentials,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        })
      : new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

  return google.drive({ version: 'v3', auth });
}

function getMultipartValue(value: MultipartValue<string> | undefined) {
  return typeof value?.value === 'string' ? value.value : '';
}

const app = Fastify({
  bodyLimit: maxFileBytes + 1024 * 1024,
  logger: true,
});

await app.register(cors, {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin allowed değil.'), false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
});

await app.register(multipart, {
  limits: {
    fileSize: maxFileBytes,
    files: 1,
  },
});

app.get('/health', async () => ({
  status: 'ok',
  driveFolderConfigured: Boolean(driveFolderId),
}));

app.post('/upload', async (request, reply) => {
  if (!driveFolderId) {
    return reply.code(500).send({
      success: false,
      error: 'DRIVE_FOLDER_ID ayarlanmamış.',
    });
  }

  const data = await request.file();

  if (!data) {
    return reply.code(400).send({
      success: false,
      error: 'Dosya bulunamadı.',
    });
  }

  const fields = data.fields as Record<string, MultipartValue<string> | MultipartFile>;
  const guestName = sanitizeName(getMultipartValue(fields.guestName as MultipartValue<string>), 'misafir');
  const originalFileName = sanitizeName(
    getMultipartValue(fields.fileName as MultipartValue<string>) || data.filename,
    'dosya',
  );
  const uploadGroupId = sanitizeName(
    getMultipartValue(fields.uploadGroupId as MultipartValue<string>),
    `${Date.now()}`,
  );
  const fileIndex = normalizeFileIndex(getMultipartValue(fields.fileIndex as MultipartValue<string>));
  const mimeType =
    getMultipartValue(fields.mimeType as MultipartValue<string>) ||
    data.mimetype ||
    'application/octet-stream';
  const savedFileName = buildSavedFileName(
    guestName,
    fileIndex,
    uploadGroupId,
    originalFileName,
  );

  const drive = getDriveClient();
  const result = await drive.files.create({
    requestBody: {
      name: savedFileName,
      parents: [driveFolderId],
    },
    media: {
      mimeType,
      body: data.file as Readable,
    },
    fields: 'id, name, webViewLink',
    supportsAllDrives: true,
  });

  return {
    success: true,
    fileId: result.data.id,
    fileUrl: result.data.webViewLink,
    fileName: result.data.name,
  };
});

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  const message = error instanceof Error ? error.message : 'Yükleme tamamlanamadı.';

  reply.code(500).send({
    success: false,
    error: message,
  });
});

await app.listen({ host: '0.0.0.0', port });
