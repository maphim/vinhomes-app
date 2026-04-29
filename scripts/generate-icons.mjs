import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, "..", "public/icons/icon.svg");
const svg = fs.readFileSync(svgPath, "utf-8");

async function generate() {
  for (const size of [192, 384, 512]) {
    const buf = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toBuffer();
    const outPath = path.join(
      __dirname,
      "..",
      "public/icons",
      `icon-${size}x${size}.png`
    );
    fs.writeFileSync(outPath, buf);
    console.log(`Created icon-${size}x${size}.png`);
  }
}

generate().catch(console.error);
