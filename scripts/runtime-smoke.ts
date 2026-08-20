import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import worker from "../worker/index";

await access(resolve("dist/index.html"));
const html = await readFile(resolve("dist/index.html"), "utf8");
if (!html.includes("KEY CRAFT 5000")) throw new Error("Build output does not contain the game title.");

const smokeAssets: Fetcher = {
  async fetch() {
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  },
  connect(): Socket {
    throw new Error("Socket connections are not used by the asset smoke double.");
  },
};
const env = {
  ASSETS: smokeAssets,
  DB: {} as D1Database,
  DELIVERABLES: {} as R2Bucket,
} satisfies Env & { DELIVERABLES: R2Bucket };
const response = await worker.fetch(new Request("https://keycraft.test/api/health"), env, {} as ExecutionContext);
if (!response.ok) throw new Error(`Health endpoint returned ${response.status}.`);
const body = await response.json<{ ok: boolean; service: string; deliverables?: boolean }>();
if (!body.ok || body.service !== "keycraft-5000" || body.deliverables !== true) throw new Error("Health endpoint payload is invalid.");

console.log("Runtime smoke passed: dist/index.html + Worker /api/health + R2 binding contract.");
