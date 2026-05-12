export function fileToBase64(
  file: File,
  onProgress?: (progress: number) => void,
) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    reader.onerror = () => {
      reject(new Error('Dosya okunamadı. Lütfen tekrar deneyin.'));
    };

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Dosya base64 formatına çevrilemedi.'));
        return;
      }

      const [, base64Data] = reader.result.split(',');
      if (!base64Data) {
        reject(new Error('Dosya base64 formatına çevrilemedi.'));
        return;
      }

      resolve(base64Data);
    };

    reader.readAsDataURL(file);
  });
}
