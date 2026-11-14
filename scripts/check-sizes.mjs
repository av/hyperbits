#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import { listBitDirs, projectRoot as root } from "./lib/bits.mjs";

const HYPERFRAMES = "hyperframes@0.8.29";
const DEFAULT_SIZES = ["16:9", "9:16", "1:1"];
const SAMPLE_FRACTIONS = [0.3, 0.65, 0.92];

const { values } = parseArgs({
  options: {
    only: { type: "string" },
    sizes: { type: "string" },
    out: { type: "string" },
    concurrency: { type: "string" },
    "sheets-only": { type: "boolean" },
    help: { type: "boolean", short: "h" },
  },
});

if (values.help) {
  console.log(`Usage: npm run check:sizes -- [--only a,b] [--sizes 16:9,9:16,1:1] [--out dir] [--concurrency 3]

Retargets every bit to each size, snapshots it with HyperFrames at ${SAMPLE_FRACTIONS.join(", ")} of its
duration, and writes one contact sheet per bit (rows: sizes, columns: times) to <out>/sheets/ plus
category overviews (rows: bits, columns: sizes, last sample) to <out>/overview/.
--sheets-only rebuilds the sheets from frames already on disk.`);
  process.exit(0);
}

const retargetModule = path.join(root, "dist", "catalog", "retarget.js");
const iifeSource = path.join(root, "dist", "hyperbits.iife.js");
for (const required of [retargetModule, iifeSource]) {
  if (!existsSync(required)) {
    console.error(
      `${path.relative(root, required)} is missing. Run npm run build first.`,
    );
    process.exit(1);
  }
}
if (spawnSync("montage", ["-version"]).status !== 0) {
  console.error("ImageMagick montage is required to build contact sheets.");
  process.exit(1);
}

const { parseSize, formatSize, retargetBitHtml } = await import(retargetModule);

const outDir = path.resolve(values.out ?? path.join(root, ".check-sizes"));
const concurrency = Math.min(
  4,
  Math.max(1, Number(values.concurrency ?? 3) || 3),
);
const sizes = (values.sizes ? values.sizes.split(",") : DEFAULT_SIZES).map(
  (value) => parseSize(value),
);
const only = values.only
  ? new Set(values.only.split(",").map((value) => value.trim()))
  : null;

const bits = listBitDirs()
  .map((dir) => ({
    dir,
    manifest: JSON.parse(readFileSync(path.join(dir, "bit.json"), "utf8")),
  }))
  .filter(({ manifest }) => !only || only.has(manifest.name));

if (bits.length === 0) {
  console.error("No bits matched.");
  process.exit(1);
}

const run = (command, args, options = {}) =>
  new Promise((resolve) => {
    const child = spawn(command, args, { cwd: outDir, ...options });
    let output = "";
    child.stdout?.on("data", (chunk) => (output += chunk));
    child.stderr?.on("data", (chunk) => (output += chunk));
    child.on("close", (code) => resolve({ code, output }));
  });

const sampleTimes = (duration) =>
  SAMPLE_FRACTIONS.map((fraction) => Number((duration * fraction).toFixed(2)));

const snapshot = async ({ dir, manifest }, size) => {
  const label = formatSize(size);
  const workDir = path.join(outDir, "work", manifest.name, label);
  const framesDir = path.join(outDir, "frames", manifest.name, label);
  const times = sampleTimes(manifest.duration);
  if (values["sheets-only"]) {
    const frames = collectFrames(framesDir, times);
    return { label, times, frames, ok: frames.every(Boolean), output: "" };
  }
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });
  mkdirSync(framesDir, { recursive: true });
  const source = readFileSync(path.join(dir, "index.html"), "utf8");
  writeFileSync(
    path.join(workDir, "index.html"),
    retargetBitHtml(source, size),
  );
  copyFileSync(iifeSource, path.join(workDir, "hyperbits.iife.js"));
  const result = await run("npx", [
    "--yes",
    HYPERFRAMES,
    "snapshot",
    workDir,
    "--at",
    times.join(","),
    "--no-end",
    "--describe",
    "false",
    "-o",
    framesDir,
  ]);
  const frames = collectFrames(framesDir, times);
  return {
    label,
    times,
    frames,
    ok: result.code === 0 && frames.every(Boolean),
    output: result.output,
  };
};

const collectFrames = (framesDir, times) => {
  const names = existsSync(framesDir)
    ? readdirSync(framesDir).filter((name) => name.endsWith(".png"))
    : [];
  return times.map((_, index) => {
    const prefix = `frame-${String(index).padStart(2, "0")}-`;
    const match = names.find((name) => name.startsWith(prefix));
    return match ? path.join(framesDir, match) : null;
  });
};

const buildSheet = async (bit, shots) => {
  const sheetsDir = path.join(outDir, "sheets");
  mkdirSync(sheetsDir, { recursive: true });
  const sheetPath = path.join(sheetsDir, `${bit.manifest.name}.jpg`);
  const args = [];
  for (const shot of shots) {
    shot.times.forEach((time, index) => {
      const frame = shot.frames[index];
      args.push("-label", `${shot.label} @ ${time}s`, frame ?? "xc:#ff0000");
    });
  }
  args.push(
    "-tile",
    `${SAMPLE_FRACTIONS.length}x${shots.length}`,
    "-geometry",
    "340x340+8+8",
    "-background",
    "#5b6b7a",
    "-fill",
    "#ffffff",
    "-pointsize",
    "16",
    "-title",
    bit.manifest.name,
    "-quality",
    "82",
    sheetPath,
  );
  const result = await run("montage", args);
  return result.code === 0 ? sheetPath : null;
};

const OVERVIEW_ROWS = 6;

const buildOverviews = async (sheetBits) => {
  const overviewDir = path.join(outDir, "overview");
  mkdirSync(overviewDir, { recursive: true });
  const categories = new Map();
  for (const bit of sheetBits) {
    const category = path.basename(path.dirname(bit.dir));
    if (!categories.has(category)) categories.set(category, []);
    categories.get(category).push(bit);
  }
  const written = [];
  for (const [category, members] of categories) {
    for (let start = 0; start < members.length; start += OVERVIEW_ROWS) {
      const page = members.slice(start, start + OVERVIEW_ROWS);
      const overviewPath = path.join(
        overviewDir,
        `${category}-${start / OVERVIEW_ROWS + 1}.jpg`,
      );
      const args = [];
      for (const bit of page) {
        for (const shot of bit.shots) {
          const last = shot.frames.at(-1);
          args.push(
            "-label",
            `${bit.manifest.name} ${shot.label} @ ${shot.times.at(-1)}s`,
            last ?? "xc:#ff0000",
          );
        }
      }
      args.push(
        "-tile",
        `${sizes.length}x${page.length}`,
        "-geometry",
        "250x250+6+6",
        "-background",
        "#5b6b7a",
        "-fill",
        "#ffffff",
        "-pointsize",
        "13",
        "-quality",
        "80",
        overviewPath,
      );
      const result = await run("montage", args);
      if (result.code === 0) written.push(overviewPath);
      else failures.push(`${category} overview`);
    }
  }
  return written;
};

const queue = bits.flatMap((bit) => sizes.map((size) => ({ bit, size })));
const results = new Map(bits.map((bit) => [bit.manifest.name, []]));
const failures = [];
let cursor = 0;
let done = 0;

mkdirSync(outDir, { recursive: true });

const worker = async () => {
  while (cursor < queue.length) {
    const job = queue[cursor++];
    const shot = await snapshot(job.bit, job.size);
    results.get(job.bit.manifest.name).push(shot);
    done += 1;
    const status = shot.ok ? "ok" : "FAIL";
    console.log(
      `[${done}/${queue.length}] ${job.bit.manifest.name} ${shot.label} ${status}`,
    );
    if (!shot.ok) {
      failures.push(`${job.bit.manifest.name} ${shot.label}`);
      console.log(shot.output.split("\n").slice(-8).join("\n"));
    }
  }
};

await Promise.all(Array.from({ length: concurrency }, worker));

const sheets = [];
for (const bit of bits) {
  const order = sizes.map(formatSize);
  const shots = results
    .get(bit.manifest.name)
    .sort(
      (left, right) => order.indexOf(left.label) - order.indexOf(right.label),
    );
  bit.shots = shots;
  const sheet = await buildSheet(bit, shots);
  if (sheet) sheets.push(sheet);
  else failures.push(`${bit.manifest.name} contact sheet`);
}

const overviews = await buildOverviews(bits);

writeFileSync(
  path.join(outDir, "index.html"),
  `<!doctype html><meta charset="utf-8"><title>hyperbits sizes</title><body style="background:#222;color:#eee;font-family:sans-serif">${sheets
    .map(
      (sheet) =>
        `<h2>${path.basename(sheet, ".jpg")}</h2><img src="sheets/${path.basename(sheet)}" style="max-width:100%">`,
    )
    .join("\n")}</body>`,
);

console.log(
  `\n${sheets.length} contact sheets in ${path.relative(process.cwd(), path.join(outDir, "sheets")) || "."}`,
);
console.log(
  `${overviews.length} overviews in ${path.relative(process.cwd(), path.join(outDir, "overview")) || "."}`,
);
console.log(`Gallery: ${path.join(outDir, "index.html")}`);
if (failures.length > 0) {
  console.error(`\n${failures.length} failures:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
