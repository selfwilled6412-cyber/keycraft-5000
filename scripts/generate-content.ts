import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog } from "./content-builder";
import { diversifyPhrases } from "./diversify-phrases";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(root, "src/content/generated/content.json");
const catalog = diversifyPhrases(buildCatalog());
const output = `${JSON.stringify(catalog)}\n`;

await mkdir(dirname(outputPath), { recursive: true });
let existing = "";
try {
  existing = await readFile(outputPath, "utf8");
} catch {
  // The first generation creates the static artifact.
}

if (existing !== output) {
  await writeFile(outputPath, output, "utf8");
}

console.log(`Generated ${catalog.phrases.length} phrases / ${catalog.missions.length} missions.`);
