import { ChangeEvent, DragEvent, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Heart,
  Loader2,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import UploadProgressList from './UploadProgressList';
import type {
  AppsScriptUploadPayload,
  AppsScriptUploadResponse,
  UploadItem,
} from '../types/upload';
import { fileToBase64 } from '../utils/fileToBase64';
import {
  inferUploadMimeType,
  sanitizeFileName,
  validateUploadFile,
} from '../utils/fileValidation';

const uploadUrl = import.meta.env.VITE_APPS_SCRIPT_UPLOAD_URL?.trim() ?? '';
const maxParallelUploads = 2;
const acceptedFileTypes = [
  'image/*',
  'video/*',
  '.3fr',
  '.arw',
  '.cr2',
  '.cr3',
  '.dng',
  '.jpg',
  '.jpeg',
  '.png',
  '.heic',
  '.heif',
  '.webp',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
  '.avif',
  '.nef',
  '.orf',
  '.pef',
  '.raf',
  '.raw',
  '.rw2',
  '.srw',
  '.x3f',
  '.3gp',
  '.3g2',
  '.avi',
  '.flv',
  '.hevc',
  '.m2ts',
  '.m4v',
  '.mkv',
  '.mov',
  '.mp4',
  '.mpeg',
  '.mpg',
  '.mts',
  '.mxf',
  '.ts',
  '.webm',
  '.wmv',
].join(',');

function createUploadGroupId() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, '');
  const randomPart =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(16).slice(2, 10);

  return `${timestamp}-${randomPart}`;
}

function createUploadItem(file: File): UploadItem {
  const validation = validateUploadFile(file);
  const itemId =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${itemId}`,
    file,
    sanitizedFileName: sanitizeFileName(file.name),
    progress: validation.isValid ? 0 : 100,
    status: validation.isValid ? 'queued' : 'error',
    message: validation.message,
  };
}

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    if (
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError')
    ) {
      return 'Yükleme adresine ulaşılamadı. Apps Script Web App URL ve deploy ayarlarını kontrol edin.';
    }

    return error.message;
  }

  return 'Yükleme sırasında beklenmeyen bir hata oluştu.';
}

async function postUploadPayload(
  endpointUrl: string,
  payload: AppsScriptUploadPayload,
) {
  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  const responseText = await response.text();
  let parsedResponse: AppsScriptUploadResponse;

  try {
    parsedResponse = JSON.parse(responseText) as AppsScriptUploadResponse;
  } catch {
    throw new Error('Sunucudan geçerli bir yanıt alınamadı.');
  }

  if (!response.ok || !parsedResponse.success) {
    throw new Error(
      parsedResponse.error || 'Google Drive yüklemesi tamamlanamadı.',
    );
  }

  return parsedResponse;
}

export default function FileUploader() {
  const [guestName, setGuestName] = useState('');
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queuedItems = useMemo(
    () => items.filter((item) => item.status === 'queued'),
    [items],
  );
  const hasSuccessfulUpload = items.some((item) => item.status === 'success');
  const hasOnlyErrors = items.length > 0 && items.every((item) => item.status === 'error');

  const updateItem = (id: string, patch: Partial<UploadItem>) => {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addFiles = (fileList: FileList | File[]) => {
    const nextItems = Array.from(fileList).map(createUploadItem);
    setItems((currentItems) => [...currentItems, ...nextItems]);
    setGlobalMessage('');
    resetFileInput();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addFiles(event.target.files);
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  };

  const uploadSingleFile = async (
    item: UploadItem,
    fileIndex: number,
    uploadGroupId: string,
  ) => {
    updateItem(item.id, {
      status: 'reading',
      progress: 5,
      message: 'Dosya yükleme için hazırlanıyor...',
    });

    const base64Data = await fileToBase64(item.file, (progress) => {
      updateItem(item.id, {
        progress: Math.min(50, Math.max(5, Math.round(progress * 0.5))),
        message: `Dosya hazırlanıyor... %${progress}`,
      });
    });

    updateItem(item.id, {
      status: 'uploading',
      progress: 60,
      message: "Google Drive'a gönderiliyor...",
    });

    const progressTimer = window.setInterval(() => {
      setItems((currentItems) =>
        currentItems.map((currentItem) => {
          if (currentItem.id !== item.id || currentItem.status !== 'uploading') {
            return currentItem;
          }

          return {
            ...currentItem,
            progress: Math.min(94, currentItem.progress + 2),
            message: "Google Drive'a gönderiliyor...",
          };
        }),
      );
    }, 1200);

    try {
      const payload: AppsScriptUploadPayload = {
        guestName: guestName.trim(),
        fileName: item.sanitizedFileName,
        mimeType: inferUploadMimeType(item.file),
        fileIndex,
        uploadGroupId,
        base64Data,
      };
      const response = await postUploadPayload(uploadUrl, payload);

      updateItem(item.id, {
        status: 'success',
        progress: 100,
        message: 'Dosya başarıyla yüklendi.',
        response,
      });
    } finally {
      window.clearInterval(progressTimer);
    }
  };

  const handleUpload = async () => {
    if (!uploadUrl) {
      setGlobalMessage(
        'Yükleme adresi eksik. Lütfen VITE_APPS_SCRIPT_UPLOAD_URL değerini ayarlayın.',
      );
      return;
    }

    if (queuedItems.length === 0) {
      setGlobalMessage('Yüklenecek uygun bir dosya seçin.');
      return;
    }

    setIsUploading(true);
    setGlobalMessage('');
    const uploadGroupId = createUploadGroupId();

    const indexedQueue = queuedItems.map((item, index) => ({
      fileIndex: index + 1,
      item,
    }));

    for (let start = 0; start < indexedQueue.length; start += maxParallelUploads) {
      const batch = indexedQueue.slice(start, start + maxParallelUploads);

      await Promise.all(
        batch.map(async ({ fileIndex, item }) => {
          try {
            await uploadSingleFile(item, fileIndex, uploadGroupId);
          } catch (error) {
            updateItem(item.id, {
              status: 'error',
              progress: 100,
              message: getFriendlyErrorMessage(error),
            });
          }
        }),
      );
    }

    resetFileInput();
    setIsUploading(false);
  };

  const clearCompletedSelection = () => {
    setItems([]);
    setGlobalMessage('');
    resetFileInput();
  };

  return (
    <div className="rounded-lg border border-white/80 bg-white/92 p-4 shadow-soft backdrop-blur sm:p-6">
      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">Adınız</span>
          <input
            className="min-h-12 rounded-lg border border-blush-100 bg-white px-4 text-base text-ink shadow-sm transition placeholder:text-stone-400 focus:border-blush-500"
            type="text"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            placeholder="İsteğe bağlı"
            autoComplete="name"
          />
        </label>

        <label
          className={
            isDragging
              ? 'flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-blush-500 bg-blush-50 px-5 py-8 text-center transition'
              : 'flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-blush-200 bg-blush-50/65 px-5 py-8 text-center transition hover:border-blush-500 hover:bg-blush-50'
          }
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept={acceptedFileTypes}
            multiple
            onChange={handleFileChange}
          />
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-white text-blush-600 shadow-sm">
            <UploadCloud className="h-8 w-8" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold text-ink">
            Fotoğraf veya video seçin
          </span>
          <span className="mt-2 max-w-sm text-sm leading-6 text-stone-600">
            Dosyalarınızı buraya sürükleyin ya da dokunarak seçin.
          </span>
          <span className="mt-3 text-xs font-medium text-stone-500">
            JPG, RAW, HEIC, MP4, MOV · Fotoğraf: 2 GB · Video: 5 GB
          </span>
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-sage-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-sage-500 disabled:cursor-not-allowed disabled:bg-stone-300"
            type="button"
            onClick={handleUpload}
            disabled={isUploading || queuedItems.length === 0}
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Heart className="h-5 w-5" aria-hidden="true" />
            )}
            Yükle
          </button>

          {items.length > 0 && (
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-blush-100 bg-white px-5 text-base font-semibold text-stone-700 shadow-sm transition hover:border-blush-200 hover:bg-blush-50 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={clearCompletedSelection}
              disabled={isUploading}
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
              Temizle
            </button>
          )}
        </div>

        {globalMessage && (
          <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{globalMessage}</span>
          </div>
        )}

        {hasSuccessfulUpload && !isUploading && (
          <div className="flex items-start gap-2 rounded-lg border border-sage-100 bg-sage-100/70 px-4 py-3 text-sm text-sage-600">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Nişan anılarımıza katkınız için teşekkür ederiz.</span>
          </div>
        )}

        {hasOnlyErrors && !isUploading && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Seçilen dosyalar yüklemeye uygun değil.</span>
          </div>
        )}
      </div>

      <UploadProgressList items={items} />
    </div>
  );
}
