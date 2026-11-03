import type { Metadata } from "next";
import { ChatStart } from "@/components/chat/start";

export const metadata: Metadata = { title: "Chat" };

export default function Page() {
  return <ChatStart />;
}
