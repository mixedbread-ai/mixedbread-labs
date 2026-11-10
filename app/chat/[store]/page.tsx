import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { z } from "zod";
import { ChatRoom } from "@/components/chat/room";
import { isMissing } from "@/lib/api";
import { chatFilesOf } from "@/lib/stores";

interface Props {
  params: Promise<{ store: string }>;
}

// Gone only when the API says so: any other failure, such as an outage,
// shows as an error, so the sidebar keeps a chat that's still there
const loadFiles = cache(async (store: string) => {
  if (!z.uuid().safeParse(store).success) return null;
  return chatFilesOf(store).catch((error: unknown) => {
    if (isMissing(error)) return null;
    throw error;
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const files = await loadFiles((await params).store);
  return { title: files?.[0]?.filename ?? "Chat", robots: { index: false } };
}

export default async function Page({ params }: Props) {
  const { store } = await params;
  const files = await loadFiles(store);
  if (!files) notFound();
  return <ChatRoom store={store} initialFiles={files} />;
}
