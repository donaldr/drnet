#!/usr/bin/env node
//
// Delete the old, now-orphaned mp4 blobs (the hash-suffixed originals that
// data.prod.json pointed at before rewire-prod-data.mjs).
//
// !! RUN THIS ONLY AFTER you've deployed the rewired data.prod.json to
//    production. Until the new build is live, the deployed site still serves
//    the old URLs — deleting them early 404s your live videos.
//
// Requires BLOB_READ_WRITE_TOKEN in .env.local (same as upload-blob.mjs).
//
// Usage:
//   node scripts/delete-orphans.mjs            # delete
//   node scripts/delete-orphans.mjs --dry-run  # just list what would be deleted
//
import { readFile } from "node:fs/promises";
import { del } from "@vercel/blob";

try {
  const env = await readFile(".env.local", "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* rely on shell env */
}

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("Missing BLOB_READ_WRITE_TOKEN (add to .env.local).");
  process.exit(1);
}

const orphans = JSON.parse(await readFile("scripts/orphaned-blobs.json", "utf8"));
const dryRun = process.argv.includes("--dry-run");

console.log(`${dryRun ? "[dry-run] would delete" : "Deleting"} ${orphans.length} orphaned blobs:`);
for (const u of orphans) console.log(`  ${u.split("/").slice(-2).join("/")}`);

if (!dryRun) {
  await del(orphans, { token });
  console.log("Done.");
} else {
  console.log("(dry run — nothing deleted)");
}
