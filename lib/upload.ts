import { PART_BYTES, type UploadedFile, type UploadStart } from "./files";
import { postJson } from "./request";

const CONCURRENT_PARTS = 4;

// What this tab uploaded, by file id: its result draws from these instead of
// downloading the file back
const uploaded = new Map<string, File>();

export function uploadedFile(id: string): File | undefined {
  return uploaded.get(id);
}

/**
 * Uploads a file straight to storage, part by part, through links the server
 * signs; `onProgress` hears the share sent so far
 */
export async function uploadFile(
  file: File,
  onProgress: (sent: number) => void
): Promise<UploadedFile> {
  const upload = await postJson<UploadStart>("/api/uploads", {
    filename: file.name,
    size: file.size,
    type: file.type,
  });

  const sent = new Map<number, number>();
  const report = () => {
    let total = 0;
    for (const bytes of sent.values()) total += bytes;
    onProgress(total / file.size);
  };

  const queue = upload.parts.slice();
  const done: { part_number: number; etag: string }[] = [];
  async function worker() {
    for (let part = queue.shift(); part; part = queue.shift()) {
      const start = (part.part_number - 1) * PART_BYTES;
      const blob = file.slice(start, start + PART_BYTES);
      const etag = await putPart(part.url, blob, (bytes) => {
        sent.set(part.part_number, bytes);
        report();
      });
      done.push({ part_number: part.part_number, etag });
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENT_PARTS, queue.length) }, worker)
  );

  const result = await postJson<UploadedFile>(`/api/uploads/${upload.id}`, {
    parts: done.toSorted((a, b) => a.part_number - b.part_number),
  });
  uploaded.set(result.id, file);
  return result;
}

/** XHR rather than fetch, as only it reports upload progress */
function putPart(
  url: string,
  blob: Blob,
  onProgress: (bytes: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (event) => onProgress(event.loaded);
    xhr.onload = () => {
      const etag = xhr.getResponseHeader("ETag");
      if (xhr.status >= 200 && xhr.status < 300 && etag) {
        onProgress(blob.size);
        resolve(etag);
      } else {
        reject(new Error("The upload failed. Try again."));
      }
    };
    xhr.onerror = () => reject(new Error("The upload failed. Try again."));
    xhr.send(blob);
  });
}
