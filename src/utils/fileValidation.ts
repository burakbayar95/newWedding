import { formatBytes } from './formatters';

export const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024 * 1024;
export const MAX_VIDEO_SIZE_BYTES = 5 * 1024 * 1024 * 1024;

const imageExtensions = new Set([
  '3fr',
  'arw',
  'cr2',
  'cr3',
  'dng',
  'jpg',
  'jpeg',
  'png',
  'heic',
  'heif',
  'webp',
  'gif',
  'bmp',
  'tif',
  'tiff',
  'avif',
  'nef',
  'orf',
  'pef',
  'raf',
  'raw',
  'rw2',
  'srw',
  'x3f',
]);
const videoExtensions = new Set([
  '3gp',
  '3g2',
  'avi',
  'flv',
  'hevc',
  'm2ts',
  'm4v',
  'mkv',
  'mov',
  'mp4',
  'mpeg',
  'mpg',
  'mts',
  'mxf',
  'ts',
  'webm',
  'wmv',
]);

const mimeTypesByExtension: Record<string, string> = {
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

export interface FileValidationResult {
  isValid: boolean;
  message: string;
}

export type UploadMediaKind = 'image' | 'video' | 'unknown';

export function getFileExtension(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return extension === fileName.toLowerCase() ? '' : extension;
}

export function getUploadMediaKind(file: File): UploadMediaKind {
  const mimeType = file.type.toLowerCase();

  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  const extension = getFileExtension(file.name);

  if (imageExtensions.has(extension)) {
    return 'image';
  }

  if (videoExtensions.has(extension)) {
    return 'video';
  }

  return 'unknown';
}

export function inferUploadMimeType(file: File) {
  const existingMimeType = file.type.toLowerCase().trim();

  if (
    existingMimeType.startsWith('image/') ||
    existingMimeType.startsWith('video/')
  ) {
    return existingMimeType === 'image/jpg' ? 'image/jpeg' : existingMimeType;
  }

  const extension = getFileExtension(file.name);
  return mimeTypesByExtension[extension] ?? 'application/octet-stream';
}

export function validateUploadFile(file: File): FileValidationResult {
  const mediaKind = getUploadMediaKind(file);

  if (mediaKind === 'unknown') {
    return {
      isValid: false,
      message:
        'Sadece fotoğraf, RAW fotoğraf veya video yükleyebilirsiniz. Desteklenen örnekler: JPG, PNG, HEIC, DNG, CR3, NEF, MP4, MOV.',
    };
  }

  if (mediaKind === 'image' && file.size > MAX_PHOTO_SIZE_BYTES) {
    return {
      isValid: false,
      message: `Fotoğraf boyutu en fazla ${formatBytes(MAX_PHOTO_SIZE_BYTES)} olabilir.`,
    };
  }

  if (mediaKind === 'video' && file.size > MAX_VIDEO_SIZE_BYTES) {
    return {
      isValid: false,
      message: `Video boyutu en fazla ${formatBytes(MAX_VIDEO_SIZE_BYTES)} olabilir.`,
    };
  }

  return {
    isValid: true,
    message: 'Yüklemeye hazır.',
  };
}

export function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim();
  const withoutTurkishCharacters = trimmed.replace(
    /[çÇğĞıİöÖşŞüÜ]/g,
    (character) => turkishCharacterMap[character] ?? character,
  );
  const normalized = withoutTurkishCharacters
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
  const safeName = normalized
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '');

  return safeName || 'dosya';
}
