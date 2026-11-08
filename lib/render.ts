import { readFile } from "node:fs/promises";
import { join } from "node:path";
import decodeHeic from "heic-decode";
import sharp from "sharp";
import init, {
  Presentation,
  set_unix_time,
  WordDocument,
} from "@/vendor/powerbottom/powerbottom_wasm.js";
import type { Format } from "./files";

// The bundler ships the module beside the route; the fonts are traced in
const WASM = new URL(
  "../vendor/powerbottom/powerbottom_wasm_bg.wasm",
  import.meta.url
);
const FONTS = join(process.cwd(), "vendor/powerbottom/fonts");

// The module and the fonts Office files expect, loaded once an instance
let fonts: Promise<Uint8Array[]> | undefined;
function loadPowerbottom(): Promise<Uint8Array[]> {
  fonts ??= (async () => {
    await init({ module_or_path: await readFile(WASM) });
    set_unix_time(Date.now() / 1000);
    const list: { fonts: { file: string }[] } = JSON.parse(
      await readFile(join(FONTS, "fonts.json"), "utf8")
    );
    return Promise.all(
      list.fonts.map(({ file }) => readFile(join(FONTS, file)))
    );
  })();
  return fonts;
}

/**
 * Page `index` (from 0) of a file the browser can't draw itself, as an image
 * it can: Word and PowerPoint pages as SVG, SVG and HEIC images as raster
 */
export async function renderPage(
  format: Format,
  bytes: Uint8Array,
  index: number
): Promise<{ body: BodyInit; type: string }> {
  if (format === "word" || format === "slides") {
    const faces = await loadPowerbottom();
    const file =
      format === "word"
        ? WordDocument.open(bytes, faces)
        : Presentation.open(bytes, faces);
    try {
      const svg =
        file instanceof WordDocument
          ? file.page_svg(index)
          : file.slide_svg(index);
      return { body: svg, type: "image/svg+xml" };
    } finally {
      file.free();
    }
  }
  if (index !== 0) throw new RangeError("An image has one page");
  if (format === "svg") {
    // Drawn as pixels, so nothing in the file runs or loads
    const png = await sharp(bytes, { density: 144 })
      .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    return { body: new Uint8Array(png), type: "image/png" };
  }
  if (format === "heic") {
    const { width, height, data } = await decodeHeic({ buffer: bytes });
    const jpeg = await sharp(data, { raw: { width, height, channels: 4 } })
      .jpeg({ quality: 85 })
      .toBuffer();
    return { body: new Uint8Array(jpeg), type: "image/jpeg" };
  }
  throw new TypeError(`The browser draws ${format} itself`);
}
