import { readdir, mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const ASSETS_DIR = path.join(ROOT, "public", "assets");
const OUT_DIR = path.join(ASSETS_DIR, "opt");
const MANIFEST = path.join(ROOT, "src", "lib", "optimized-assets.ts");
const WIDTHS = [640, 1080, 1920];
const SKIP = new Set(["og-image.jpg"]);

async function collect(dir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "opt") continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await collect(path.join(dir, entry.name), rel)));
    } else if (/\.(jpe?g|png|webp)$/i.test(entry.name) && !SKIP.has(rel)) {
      files.push(rel);
    }
  }
  return files;
}

const files = await collect(ASSETS_DIR);
const processed = [];
let before = 0;
let after = 0;

for (const rel of files) {
  const input = path.join(ASSETS_DIR, rel);
  const base = rel.replace(/\.[^.]+$/, "");
  before += (await stat(input)).size;
  for (const width of WIDTHS) {
    const output = path.join(OUT_DIR, `${base}-${width}.webp`);
    await mkdir(path.dirname(output), { recursive: true });
    const info = await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 76, effort: 6 })
      .toFile(output);
    if (width === 1080) after += info.size;
  }
  processed.push(rel);
}

const manifest = `export const OPTIMIZED_ASSET_WIDTHS = [${WIDTHS.join(", ")}];

export const OPTIMIZED_ASSETS = new Set<string>([
${processed.map((rel) => `  ${JSON.stringify(rel)},`).join("\n")}
]);
`;
await writeFile(MANIFEST, manifest);

console.log(
  `Optimized ${processed.length} assets. Originals ${(before / 1024).toFixed(0)} KiB, 1080w variants ${(after / 1024).toFixed(0)} KiB.`,
);
