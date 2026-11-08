/** The largest file a visitor may upload */
export const MAX_FILE_BYTES = 100 * 1024 * 1024;

/** Every presigned part but the last is this size; S3 takes 5 MB at least */
export const PART_BYTES = 10 * 1024 * 1024;

/**
 * What parsing reads, by how its pages draw: PDFs in the browser, images the
 * browser shows as they are, and the rest drawn on the server
 */
const FORMATS = {
  pdf: ["pdf"],
  image: ["png", "jpg", "jpeg", "webp", "gif", "avif"],
  word: ["doc", "docx", "docm", "dotx", "dotm", "odt", "rtf"],
  slides: ["ppt", "pptx", "ppsx", "odp", "key"],
  svg: ["svg"],
  heic: ["heic", "heif"],
} as const;

export type Format = keyof typeof FORMATS;

export function formatOf(filename: string): Format | undefined {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return (Object.keys(FORMATS) as Format[]).find((format) =>
    (FORMATS[format] as readonly string[]).includes(extension)
  );
}

export const PARSE_ACCEPT = Object.values(FORMATS)
  .flat()
  .map((extension) => `.${extension}`)
  .join(",");

/** The API deletes a parse and its file a week after the upload */
export const PARSE_LIFETIME = 7 * 24 * 60 * 60 * 1000;

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
