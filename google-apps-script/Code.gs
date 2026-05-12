const FOLDER_ID = 'GOOGLE_DRIVE_KLASOR_IDINIZ';

const MIME_TYPES_BY_EXTENSION = {
  '3fr': 'image/x-hasselblad-3fr',
  arw: 'image/x-sony-arw',
  cr2: 'image/x-canon-cr2',
  cr3: 'image/x-canon-cr3',
  dng: 'image/x-adobe-dng',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  avif: 'image/avif',
  nef: 'image/x-nikon-nef',
  orf: 'image/x-olympus-orf',
  pef: 'image/x-pentax-pef',
  raf: 'image/x-fuji-raf',
  raw: 'image/x-raw',
  rw2: 'image/x-panasonic-rw2',
  srw: 'image/x-samsung-srw',
  x3f: 'image/x-sigma-x3f',
  '3gp': 'video/3gpp',
  '3g2': 'video/3gpp2',
  avi: 'video/x-msvideo',
  flv: 'video/x-flv',
  hevc: 'video/hevc',
  m2ts: 'video/mp2t',
  m4v: 'video/x-m4v',
  mkv: 'video/x-matroska',
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  mts: 'video/mp2t',
  mxf: 'video/mxf',
  ts: 'video/mp2t',
  webm: 'video/webm',
  wmv: 'video/x-ms-wmv',
};

function doGet() {
  return createJsonResponse({
    status: 'ok',
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('İstek gövdesi boş.');
    }

    const folderId = getFolderId(FOLDER_ID);

    if (!folderId) {
      throw new Error('Apps Script içindeki FOLDER_ID değeri güncellenmemiş.');
    }

    const body = JSON.parse(e.postData.contents);
    const guestName = sanitizeName(body.guestName || 'misafir') || 'misafir';
    const originalFileName = sanitizeFileName(body.fileName || 'dosya');
    const mimeType = normalizeMimeType(body.mimeType, originalFileName);
    const fileIndex = normalizeFileIndex(body.fileIndex);
    const base64Data = stripDataUrlPrefix(String(body.base64Data || ''));

    if (!isAllowedMediaMimeType(mimeType)) {
      throw new Error(
        'Sadece fotoğraf, RAW fotoğraf veya video dosyaları kabul edilir.',
      );
    }

    if (!base64Data) {
      throw new Error('Dosya verisi boş.');
    }

    const folder = DriveApp.getFolderById(folderId);
    const timestamp = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() || 'Europe/Istanbul',
      'yyyy-MM-dd_HH-mm-ss',
    );
    const uploadGroupId =
      sanitizeName(body.uploadGroupId || `${timestamp}_${Utilities.getUuid().slice(0, 8)}`) ||
      `${timestamp}_${Utilities.getUuid().slice(0, 8)}`;
    const savedFileName = buildSavedFileName(
      guestName,
      fileIndex,
      uploadGroupId,
      originalFileName,
    );
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, savedFileName);
    const file = folder.createFile(blob);

    return createJsonResponse({
      success: true,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      fileName: file.getName(),
    });
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error && error.message ? error.message : 'Yükleme tamamlanamadı.',
    });
  }
}

function doOptions() {
  return createJsonResponse({
    status: 'ok',
  });
}

function createJsonResponse(payload) {
  // ContentService custom CORS header set edemez. Frontend JSON'u text/plain
  // olarak gönderdiği için tarayıcı preflight yapmadan doPost'a ulaşabilir.
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function stripDataUrlPrefix(base64Data) {
  const commaIndex = base64Data.indexOf(',');
  return commaIndex >= 0 ? base64Data.slice(commaIndex + 1) : base64Data;
}

function getFolderId(value) {
  const folderValue = String(value || '').trim();

  if (!folderValue || folderValue === 'GOOGLE_DRIVE_KLASOR_IDINIZ') {
    return '';
  }

  const urlMatch = folderValue.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  return folderValue;
}

function normalizeMimeType(mimeType, fileName) {
  const normalizedMimeType = String(mimeType || '').trim().toLowerCase();

  if (normalizedMimeType.indexOf('image/') === 0 || normalizedMimeType.indexOf('video/') === 0) {
    return normalizedMimeType === 'image/jpg' ? 'image/jpeg' : normalizedMimeType;
  }

  const extension = getFileExtension(fileName);
  return MIME_TYPES_BY_EXTENSION[extension] || normalizedMimeType;
}

function isAllowedMediaMimeType(mimeType) {
  return (
    typeof mimeType === 'string' &&
    (mimeType.indexOf('image/') === 0 || mimeType.indexOf('video/') === 0)
  );
}

function getFileExtension(fileName) {
  const match = String(fileName || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
}

function normalizeFileIndex(value) {
  const parsedIndex = parseInt(value, 10);
  const safeIndex = isNaN(parsedIndex) || parsedIndex < 1 ? 1 : parsedIndex;
  return String(safeIndex).padStart(3, '0');
}

function buildSavedFileName(guestName, fileIndex, uploadGroupId, originalFileName) {
  const dotIndex = originalFileName.lastIndexOf('.');

  if (dotIndex <= 0) {
    return `${guestName}_${fileIndex}_${originalFileName}_${uploadGroupId}`;
  }

  const baseName = originalFileName.slice(0, dotIndex);
  const extension = originalFileName.slice(dotIndex);
  return `${guestName}_${fileIndex}_${baseName}_${uploadGroupId}${extension}`;
}

function sanitizeName(value) {
  return transliterateTurkish(String(value))
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 80);
}

function sanitizeFileName(value) {
  const safeName = transliterateTurkish(String(value))
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 140);

  return safeName || 'dosya';
}

function transliterateTurkish(value) {
  const replacements = {
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

  return value
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (character) => replacements[character] || character)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}
