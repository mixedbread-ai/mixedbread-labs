import type { Metadata } from "next";
import { ParseStart } from "@/components/parse/start";

export const metadata: Metadata = { title: "Parse" };

export default function Page() {
  return <ParseStart />;
}
