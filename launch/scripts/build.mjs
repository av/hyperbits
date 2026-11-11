import { execFileSync, execFile } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const launchDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoDir = join(launchDir, "..");
const cli = join(repoDir, "dist/cli/index.js");
const iife = join(repoDir, "dist/hyperbits.iife.js");
const hyperframes = ["--yes", "hyperframes@0.8.29"];
const skipPosters = process.argv.includes("--skip-posters");

if (!existsSync(cli) || !existsSync(iife)) {
  console.error("Run `npm run build` in the repository root first.");
  process.exit(1);
}

const categories = [
  { dir: "text-animations", label: "Text Animations", color: "#d0a215" },
  { dir: "staggered-motion", label: "Staggered Motion", color: "#879a39" },
  { dir: "background-effects", label: "Background Effects", color: "#ce5d97" },
  { dir: "motion-loops", label: "Motion Loops", color: "#3aa99f" },
  { dir: "particles", label: "Particles", color: "#d14d41" },
  { dir: "scenes-3d", label: "3D Scenes", color: "#4385be" },
  { dir: "full-compositions", label: "Full Compositions", color: "#8b7ec8" },
];

const heroes = {
  "counter-confetti": { start: 10.6, end: 14.2, mediaStart: 2.25 },
  "card-stack": { start: 13.1, end: 16.7, mediaStart: 0 },
  "bauhaus-tiles": { start: 15.6, end: 19.2, mediaStart: 2 },
  "pinwheel-grid": { start: 18.1, end: 21.7, mediaStart: 3 },
  carousel: { start: 24.9, end: 34.9, mediaStart: 0 },
};

const windows = [
  { start: 0, end: 12, cap: 4 },
  { start: 12, end: 28.6, cap: 2 },
  { start: 28.6, end: 38, cap: 3 },
];

const inventory = JSON.parse(
  readFileSync(join(repoDir, "src/catalog/inventory.generated.json"), "utf8"),
);
const bits = inventory
  .map((bit) => {
    const category = categories.findIndex(
      (entry) => entry.dir === bit.sourcePath.split("/")[1],
    );
    const loop = bit.tags.includes("loop");
    const mediaStart = loop ? 0 : round(bit.duration * 0.3);
    const segment = loop ? bit.duration : round(bit.duration * 0.55);
    return {
      id: bit.id,
      name: bit.name,
      duration: bit.duration,
      category,
      loop,
      mediaStart,
      segment,
    };
  })
  .sort(
    (left, right) =>
      left.category - right.category || left.id.localeCompare(right.id),
  );

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function clipsFor(bit) {
  const hero = heroes[bit.id];
  const spans = [];
  for (const window of windows) {
    let cursor = window.start;
    let count = 0;
    while (cursor < window.end - 0.05 && count < window.cap) {
      const end = Math.min(window.end, cursor + bit.segment);
      spans.push({ start: cursor, end, mediaStart: bit.mediaStart });
      cursor = end;
      count += 1;
    }
  }
  if (!hero) return spans;
  const kept = [];
  for (const span of spans) {
    if (span.end <= hero.start || span.start >= hero.end) kept.push(span);
    else if (span.start < hero.start) kept.push({ ...span, end: hero.start });
  }
  kept.push(hero);
  return kept.sort((left, right) => left.start - right.start);
}

function tileMarkup(bit, index) {
  const color = categories[bit.category].color;
  const hosts = clipsFor(bit)
    .map(
      (span, clip) =>
        `<div class="lv-host" id="tile-${bit.id}-${clip}" data-composition-id="tile-${bit.id}-${clip}" data-composition-src="compositions/${bit.id}.html" data-start="${round(span.start)}" data-media-start="${round(span.mediaStart)}" data-duration="${round(span.end - span.start)}" data-width="1920" data-height="1080"></div>`,
    )
    .join("");
  return `<div class="lv-tile" data-index="${index}" data-id="${bit.id}" data-category="${bit.category}">
          <div class="lv-screen" style="border-color:${color}"><img class="lv-poster" src="public/posters/${bit.id}.jpg" alt="" />${hosts}<div class="lv-shade"></div></div>
          <div class="lv-inspect"><div class="lv-outline"></div><div class="lv-tag"><b>div</b>${bit.id}.html</div><div class="lv-dims">1920 × 1080</div></div>
        </div>`;
}

mkdirSync(join(launchDir, "compositions"), { recursive: true });
mkdirSync(join(launchDir, "public/posters"), { recursive: true });
copyFileSync(iife, join(launchDir, "public/hyperbits.iife.js"));
for (const bit of bits) {
  execFileSync("node", [cli, "add", bit.id, "--into", "compositions/"], {
    cwd: launchDir,
    stdio: "ignore",
  });
}

const data = {
  categories: categories.map(({ label, color }, index) => ({
    label,
    color,
    count: bits.filter((bit) => bit.category === index).length,
  })),
  bits: bits.map(({ id, name, category }) => ({ id, name, category })),
  heroes,
};

const template = readFileSync(join(launchDir, "src/template.html"), "utf8");
const html = template
  .replace("<!--TILES-->", bits.map(tileMarkup).join("\n        "))
  .replace("/*LAUNCH_DATA*/", `window.LAUNCH_DATA = ${JSON.stringify(data)};`)
  .replace("/*LAUNCH_SCRIPT*/", () =>
    readFileSync(join(launchDir, "src/launch.js"), "utf8"),
  );
writeFileSync(join(launchDir, "index.html"), html);
console.log(
  `index.html: ${bits.length} tiles, ${bits.reduce((sum, bit) => sum + clipsFor(bit).length, 0)} live clips`,
);

if (!skipPosters) {
  const pending = bits.filter(
    (bit) => !existsSync(join(launchDir, `public/posters/${bit.id}.jpg`)),
  );
  const workDir = join(launchDir, "out/posters");
  async function poster(bit) {
    const dir = join(workDir, bit.id);
    mkdirSync(dir, { recursive: true });
    copyFileSync(
      join(launchDir, `compositions/${bit.id}.html`),
      join(dir, "index.html"),
    );
    copyFileSync(iife, join(dir, "hyperbits.iife.js"));
    await run(
      "npx",
      [
        ...hyperframes,
        "snapshot",
        "--at",
        String(bit.mediaStart + 0.001),
        "--no-end",
        "--timeout",
        "15000",
        "-o",
        join(dir, "snap"),
      ],
      { cwd: dir },
    );
    const frame = execFileSync("sh", [
      "-c",
      `ls ${join(dir, "snap")}/frame-*.png | head -1`,
    ])
      .toString()
      .trim();
    await run("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-i",
      frame,
      "-vf",
      "scale=960:-1",
      "-q:v",
      "3",
      join(launchDir, `public/posters/${bit.id}.jpg`),
    ]);
  }
  const queue = [...pending];
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (queue.length) await poster(queue.shift());
    }),
  );
  console.log(`posters: ${pending.length} generated`);
}
