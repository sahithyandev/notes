import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { OG_WIDTH, OG_HEIGHT, ogTemplate, type OgPage } from "./template";

// Resolved against the project root rather than `import.meta.dirname`,
// which would point at the build output once this module is bundled into
// the prerendered OG route's output chunk.
const FONTS_DIR = path.resolve(process.cwd(), "src/assets/og/fonts");

let fontsPromise: Promise<
  { name: string; data: Buffer; weight: 400 | 500; style: "normal" }[]
> | null = null;

function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.resolve([
      {
        name: "Sagittaire Display",
        data: fs.readFileSync(
          path.join(FONTS_DIR, "SagittaireDisplay-Regular.ttf"),
        ),
        weight: 400 as const,
        style: "normal" as const,
      },
      {
        name: "DM Sans",
        data: fs.readFileSync(path.join(FONTS_DIR, "DMSans-Medium.ttf")),
        weight: 500 as const,
        style: "normal" as const,
      },
      {
        name: "JetBrains Mono",
        data: fs.readFileSync(path.join(FONTS_DIR, "JetBrainsMono-Medium.ttf")),
        weight: 500 as const,
        style: "normal" as const,
      },
    ]);
  }
  return fontsPromise;
}

export async function renderOgImage(page: OgPage): Promise<Buffer> {
  const fonts = await loadFonts();
  const tree = ogTemplate(page);

  const svg = await satori(tree as never, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });

  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: OG_WIDTH },
    // satori embeds every glyph it uses directly in the SVG, so resvg never
    // needs the system font database; scanning it by default cost roughly
    // half of resvg's render time per image (~995 images at build time).
    font: { loadSystemFonts: false },
  })
    .render()
    .asPng();

  return sharp(png).jpeg({ quality: 88 }).toBuffer();
}
