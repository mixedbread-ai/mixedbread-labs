import type { ChatFile } from "./chat";
import { MAX_CHAT_FILES } from "./files";
import { getMixedbreadClient } from "./mixedbread";

/** A chat's files and how far indexing each has got */
export async function chatFilesOf(store: string): Promise<ChatFile[]> {
  const { data } = await getMixedbreadClient().stores.files.list(store, {
    limit: MAX_CHAT_FILES,
  });
  return data.map((file) => ({
    id: file.id,
    filename: file.filename ?? "Untitled",
    status: file.status ?? "pending",
  }));
}
