#!/usr/bin/env node
//
// Upload generated video artifacts to Vercel Blob.
//
// Requires BLOB_READ_WRITE_TOKEN — put it in .env.local (gitignored):
//   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx
// Get it from Vercel dashboard > Storage > (your Blob store) > tokens, or `vercel env pull`.
//
// Uploads to deterministic paths (no random suffix) so URLs are stable:
//   public/work-compressed/<p>.mp4  -> work/<p>.mp4
//   public/work-posters/<p>.webp    -> work-posters/<p>.webp
//   public/work-hls/<p>             -> work-hls/<p>
// Writes the resulting URL map to scripts/blob-urls.json.
//
// Usage:
//   node scripts/upload-blob.mjs                 # all sets
//   node scripts/upload-blob.mjs compressed      # just one set
//   node scripts/upload-blob.mjs posters hls
//
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

// --- load .env.local without a dotenv dependency ---
try {
  const env = await readFile(".env.local", "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  /* no .env.local — rely on the shell env */
}

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("Missing BLOB_READ_WRITE_TOKEN. Add it to .env.local:");
  console.error("  BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx");
  process.exit(1);
}

const CONTENT_TYPE = {
  ".mp4": "video/mp4",
  ".webp": "image/webp",
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
};

const SETS = {
  compressed: { dir: "public/work-compressed", prefix: "work" },
  posters: { dir: "public/work-posters", prefix: "work-posters" },
  hls: { dir: "public/work-hls", prefix: "work-hls" },
};

const requested = process.argv.slice(2);
const sets = requested.length ? requested : Object.keys(SETS);

const urls = {};
for (const name of sets) {
  const set = SETS[name];
  if (!set) {
    console.error(`unknown set "${name}" (valid: ${Object.keys(SETS).join(", ")})`);
    continue;
  }
  let entries;
  try {
    entries = await readdir(set.dir, { recursive: true, withFileTypes: true });
  } catch {
    console.error(`skip "${name}": ${set.dir} not found (run the generate scripts first)`);
    continue;
  }
  const files = entries.filter((e) => e.isFile());
  console.log(`\n=== ${name}: ${files.length} files ===`);
  urls[name] = {};
  for (const e of files) {
    const full = path.join(e.parentPath ?? e.path, e.name);
    const rel = path.relative(set.dir, full).split(path.sep).join("/");
    const pathname = `${set.prefix}/${rel}`;
    const body = await readFile(full);
    const ext = path.extname(e.name).toLowerCase();
    const res = await put(pathname, body, {
      access: "public",
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: CONTENT_TYPE[ext] || "application/octet-stream",
    });
    urls[name][rel] = res.url;
    console.log(`  ${rel} -> ${res.url}`);
  }
}

await writeFile("scripts/blob-urls.json", JSON.stringify(urls, null, 2));
console.log("\nWrote scripts/blob-urls.json");
