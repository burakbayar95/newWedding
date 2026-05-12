const byteUnits = ['B', 'KB', 'MB', 'GB'] as const;

export function formatBytes(bytes: number) {
  if (bytes === 0) {
    return '0 B';
  }

  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    byteUnits.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;
  const fractionDigits = value >= 10 || unitIndex === 0 ? 0 : 1;

  return `${value.toFixed(fractionDigits)} ${byteUnits[unitIndex]}`;
}

export function formatMimeLabel(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return 'Fotoğraf';
  }

  if (mimeType.startsWith('video/')) {
    return 'Video';
  }

  return 'Dosya';
}
