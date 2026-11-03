import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import { fonts } from "@/lib/fonts";

const DESCRIPTION =
  "Try Mixedbread without signing up: parse documents and inspect every element, or upload files and chat with them. Every result is a link to share.";
const IMAGE = "https://www.mixedbread.com/images/og/root.jpg";

export const metadata: Metadata = {
  title: { default: "Mixedbread Labs", template: "%s - Mixedbread Labs" },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Mixedbread",
    title: "Mixedbread Labs",
    description: DESCRIPTION,
    images: [{ url: IMAGE, width: 1200, height: 630, alt: "Mixedbread Labs" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@mixedbreadai",
    title: "Mixedbread Labs",
    description: DESCRIPTION,
    images: [IMAGE],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fonts} suppressHydrationWarning>
      <body>
        <Providers>
          {/* One screen: each tool scrolls inside its own panes */}
          <div className="flex h-svh min-h-128 flex-col">
            <Header />
            <main className="flex min-h-0 flex-1 flex-col">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
