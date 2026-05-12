import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  Loader2,
  Video,
} from 'lucide-react';
import type { UploadItem } from '../types/upload';
import { formatBytes, formatMimeLabel } from '../utils/formatters';

interface UploadProgressListProps {
  items: UploadItem[];
}

const statusLabels: Record<UploadItem['status'], string> = {
  queued: 'Hazır',
  reading: 'Hazırlanıyor',
  uploading: 'Yükleniyor',
  success: 'Yüklendi',
  error: 'Hata',
};

export default function UploadProgressList({ items }: UploadProgressListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 space-y-3" aria-label="Yükleme durumları">
      {items.map((item) => {
        const isVideo = item.file.type.startsWith('video/');
        const isBusy = item.status === 'reading' || item.status === 'uploading';

        return (
          <article
            key={item.id}
            className="rounded-lg border border-blush-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blush-50 text-blush-600">
                {isVideo ? (
                  <Video className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <FileImage className="h-5 w-5" aria-hidden="true" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-ink">
                      {item.file.name}
                    </h3>
                    <p className="mt-1 text-xs text-stone-500">
                      {formatMimeLabel(item.file.type)} · {formatBytes(item.file.size)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-medium">
                    {item.status === 'success' && (
                      <CheckCircle2
                        className="h-4 w-4 text-sage-600"
                        aria-hidden="true"
                      />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle
                        className="h-4 w-4 text-red-600"
                        aria-hidden="true"
                      />
                    )}
                    {isBusy && (
                      <Loader2
                        className="h-4 w-4 animate-spin text-blush-600"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={
                        item.status === 'error'
                          ? 'text-red-700'
                          : item.status === 'success'
                            ? 'text-sage-600'
                            : 'text-stone-600'
                      }
                    >
                      {statusLabels[item.status]}
                    </span>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className={
                      item.status === 'error'
                        ? 'h-full rounded-full bg-red-500 transition-all duration-300'
                        : 'h-full rounded-full bg-blush-500 transition-all duration-300'
                    }
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                <div className="mt-2 text-xs text-stone-500">
                  <span>{item.message}</span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
