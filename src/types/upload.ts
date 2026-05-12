export type UploadStatus = 'queued' | 'reading' | 'uploading' | 'success' | 'error';

export interface AppsScriptUploadPayload {
  guestName: string;
  fileName: string;
  mimeType: string;
  fileIndex: number;
  uploadGroupId: string;
  base64Data: string;
}

export interface AppsScriptUploadResponse {
  success: boolean;
  fileId?: string;
  fileUrl?: string;
  fileName?: string;
  error?: string;
}

export interface UploadItem {
  id: string;
  file: File;
  sanitizedFileName: string;
  status: UploadStatus;
  progress: number;
  message: string;
  response?: AppsScriptUploadResponse;
}
