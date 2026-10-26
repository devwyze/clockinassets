#!/usr/bin/env node
// Publishing helper for clockin-assets (Node 18+, no dependencies).
//
//   node scripts/pin-urls.mjs pin   <owner/repo> <images-commit>
//     Replaces {{REPO}} and {{IMAGES_COMMIT}} in collection.json and metadata/*.json,
//     so every image URL is pinned to the commit that added the images.
//
//   node scripts/pin-urls.mjs check <owner/repo> <metadata-commit>
//     Fetches every JSON file at <metadata-commit> through jsDelivr, then every image it
//     references, and fails if anything is not HTTP 200.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const JSON_FILES = ["collection.json", ...readdirSync("metadata").filter((f) => f.endsWith(".json")).map((f) => join("metadata", f))];

const [command, repo, commit] = process.argv.slice(2);
if (!["pin", "check"].includes(command) || !/^[\w.-]+\/[\w.-]+$/.test(repo ?? "") || !/^[0-9a-f]{7,40}$/.test(commit ?? "")) {
  console.error("usage: node scripts/pin-urls.mjs pin|check <owner/repo> <commit-sha>");
  process.exit(2);
}

if (command === "pin") {
  for (const file of JSON_FILES) {
    const text = readFileSync(file, "utf8");
    if (!text.includes("{{REPO}}")) {
      console.error(`${file}: already pinned (no {{REPO}} placeholder); restore it from git to re-pin`);
      process.exit(1);
    }
    writeFileSync(file, text.replaceAll("{{REPO}}", repo).replaceAll("{{IMAGES_COMMIT}}", commit));
    console.log(`pinned ${file}`);
  }
  console.log("\nNext: commit these files, push, then run `check` with the new commit SHA.");
} else {
  const base = `https://cdn.jsdelivr.net/gh/${repo}@${commit}`;
  let failures = 0;
  const get = async (url) => {
    const res = await fetch(url);
    const ok = res.status === 200;
    if (!ok) failures++;
    console.log(`${ok ? "ok " : "ERR"} ${res.status}  ${url}`);
    return ok ? res : null;
  };
  for (const file of JSON_FILES) {
    const res = await get(`${base}/${file.replaceAll("\\", "/")}`);
    if (!res) continue;
    const doc = await res.json();
    for (const url of new Set([doc.image, ...(doc.properties?.files ?? []).map((f) => f.uri)])) await get(url);
  }
  console.log(failures ? `\n${failures} URL(s) failed` : `\nAll URLs return 200. Badge URI base: ${base}/metadata/`);
  process.exit(failures ? 1 : 0);
}
