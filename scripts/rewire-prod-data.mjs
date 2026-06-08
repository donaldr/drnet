#!/usr/bin/env node
//
// Repoint data.prod.json at the freshly uploaded Blob assets.
//
// Reads scripts/blob-urls.json (written by upload-blob.mjs) and, for each work
// item, replaces the mp4 `video`/`hero` with the compressed versions and adds
// `poster`/`heroPoster`. Leaves `videoHls`/`heroHls` UNSET (HLS is untested in
// prod) — the HLS master URLs are written to scripts/hls-fields.json for you to
// merge in later. Captures the old mp4 URLs to scripts/orphaned-blobs.json so
// delete-orphans.mjs can remove them after you deploy.
//
import { readFile, writeFile } from "node:fs/promises";

const DATA = "src/app/(default)/@work/data.prod.json";
const urls = JSON.parse(await readFile("scripts/blob-urls.json", "utf8"));
const data = JSON.parse(await readFile(DATA, "utf8"));

// From an old blob mp4 URL -> "dir/name" stem (strip leading work/, the Vercel
// random "-<hash>" suffix, and the extension). Matches our local file naming.
function stem(url) {
  const p = new URL(url).pathname.replace(/^\/work\//, "").replace(/\.mp4$/, "");
  return p.replace(/-[A-Za-z0-9]{20,}$/, "");
}

const comp = urls.compressed ?? {};
const post = urls.posters ?? {};
const hls = urls.hls ?? {};

const orphans = [];
const hlsFields = [];
let rewired = 0;

for (const w of data.work) {
  const entry = { slug: w.slug };
  for (const [field, posterField, hlsField] of [
    ["video", "poster", "videoHls"],
    ["hero", "heroPoster", "heroHls"],
  ]) {
    const val = w[field];
    if (typeof val !== "string" || !val.endsWith(".mp4")) continue; // skip image heroes
    orphans.push(val);
    const s = stem(val);
    if (comp[`${s}.mp4`]) {
      w[field] = comp[`${s}.mp4`];
      rewired++;
    } else {
      console.warn(`! no compressed upload for ${s} (${field}) — left as-is`);
    }
    if (post[`${s}.webp`]) w[posterField] = post[`${s}.webp`];
    if (hls[`${s}/master.m3u8`]) entry[hlsField] = hls[`${s}/master.m3u8`];
  }
  if (entry.videoHls || entry.heroHls) hlsFields.push(entry);
}

await writeFile("scripts/orphaned-blobs.json", JSON.stringify(orphans, null, 2));
await writeFile("scripts/hls-fields.json", JSON.stringify(hlsFields, null, 2));
await writeFile(DATA, JSON.stringify(data, null, 2) + "\n");

console.log(`Rewired ${rewired} mp4 fields across ${data.work.length} work items.`);
console.log(`Captured ${orphans.length} orphan URLs -> scripts/orphaned-blobs.json`);
console.log(`HLS URLs (to enable later) -> scripts/hls-fields.json`);
