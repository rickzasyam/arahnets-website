#!/usr/bin/env node
/* ============================================================
   ARAHNETS — client logo manifest generator
   Scans assets/client-logo/ and (re)writes logos.json, which the
   marquee (js/main.js) reads to build the "Selected clients" band.

   - Adds new image files, drops files that were deleted.
   - Preserves the order and any hand-edited `alt` text of files
     already listed, so corrections aren't lost on regenerate.
   - New files get an `alt` auto-derived from the filename; edit
     logos.json afterwards if you want a nicer brand name.

   Usage:
     node scripts/generate-logos.mjs           # one-off
     node scripts/generate-logos.mjs --watch   # regenerate on change
   ============================================================ */

import { readdirSync, readFileSync, writeFileSync, watch } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const LOGO_DIR = join(HERE, "..", "assets", "client-logo");
const OUT = join(LOGO_DIR, "logos.json");
const IMG = /\.(svg|png|jpe?g|webp|avif)$/i;

// "KB_Bank_logo.png" -> "KB Bank"   ·   "Logo_Nobubank.png" -> "Nobubank"
const deriveAlt = (file) =>
  file
    .replace(/\.[^.]+$/, "")          // drop extension
    .replace(/[_\-.]+/g, " ")         // separators -> space
    .replace(/\blogo\b/gi, "")        // drop the literal word "logo"
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || file; // Title Case first letters

function generate() {
  let files;
  try {
    files = readdirSync(LOGO_DIR).filter((f) => IMG.test(f));
  } catch {
    console.error(`[logos] folder not found: ${LOGO_DIR}`);
    return;
  }

  let existing = [];
  try { existing = JSON.parse(readFileSync(OUT, "utf8")); } catch { /* first run */ }

  const kept = existing.filter((e) => e && files.includes(e.file)); // preserve order + alt, drop deleted
  const keptFiles = new Set(kept.map((e) => e.file));
  const added = files
    .filter((f) => !keptFiles.has(f))
    .sort((a, b) => a.localeCompare(b))
    .map((f) => ({ file: f, alt: deriveAlt(f) }));

  const out = [...kept, ...added];
  const content = JSON.stringify(out, null, 2) + "\n";

  let prev = "";
  try { prev = readFileSync(OUT, "utf8"); } catch { /* none yet */ }
  if (content === prev) return out; // no change -> no write (prevents watch loops)

  writeFileSync(OUT, content);
  const note = added.length ? ` (+${added.length} new: ${added.map((a) => a.file).join(", ")})` : "";
  console.log(`[logos] wrote logos.json — ${out.length} logo(s)${note}`);
  return out;
}

generate();

if (process.argv.includes("--watch")) {
  console.log("[logos] watching assets/client-logo/ … (Ctrl+C to stop)");
  let t;
  watch(LOGO_DIR, (_event, filename) => {
    if (filename === "logos.json") return; // ignore our own writes
    clearTimeout(t);
    t = setTimeout(generate, 150);
  });
}
