import { cpSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// PDF.js fetches these at runtime for CJK text, unembedded fonts and JPEG 2000 images
const pdfjs = dirname(
  createRequire(import.meta.url).resolve("pdfjs-dist/package.json")
);
for (const folder of ["cmaps", "standard_fonts", "wasm"]) {
  cpSync(
    join(pdfjs, folder),
    join(import.meta.dirname, "../public/pdfjs", folder),
    {
      recursive: true,
    }
  );
}
