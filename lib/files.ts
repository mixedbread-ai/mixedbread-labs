/** The largest file a visitor may upload */
export const MAX_FILE_BYTES = 100 * 1024 * 1024;

/** Every presigned part but the last is this size; S3 takes 5 MB at least */
export const PART_BYTES = 10 * 1024 * 1024;

/** What parsing reads: documents that render to pages, and images */
export const PARSE_ACCEPT =
  ".pdf,.doc,.docx,.odt,.ppt,.pptx,.odp,.key,.png,.jpg,.jpeg,.webp,.gif,.tiff,.bmp";

/** What a chat indexes: parsable documents, and text */
export const CHAT_ACCEPT = `${PARSE_ACCEPT},.txt,.md,.mdx,.html,.csv,.json,.xlsx,.xls`;

export const MAX_CHAT_FILES = 10;

/** A file the API holds, as the browser knows it after uploading */
export interface UploadedFile {
  id: string;
  filename: string;
}

export interface UploadStart {
  id: string;
  parts: { part_number: number; url: string }[];
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Number((bytes / 1024 / 1024).toFixed(1))} MB`;
}
