import { cn } from "cn";
import { Geist_Mono as FontMono, Geist as FontSans } from "next/font/google";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

// Only code views use it, so it loads when one shows instead of with every page
const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
  preload: false,
});

export const fonts = cn(
  "touch-manipulation font-sans antialiased",
  fontSans.variable,
  fontMono.variable
);
