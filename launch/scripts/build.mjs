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
const refreshPosters = process.argv.includes("--refresh-posters");

if (!existsSync(cli) || !existsSync(iife)) {
  console.error("Run `npm run build` in the repository root first.");
  process.exit(1);
}

const categories = [
  { dir: "text-animations", label: "Text Animations", icon: "text_fields" },
  { dir: "staggered-motion", label: "Staggered Motion", icon: "stacks" },
  { dir: "background-effects", label: "Background Effects", icon: "gradient" },
  { dir: "motion-loops", label: "Motion Loops", icon: "all_inclusive" },
  { dir: "particles", label: "Particles", icon: "grain" },
  { dir: "scenes-3d", label: "3D Scenes", icon: "view_in_ar" },
  { dir: "full-compositions", label: "Full Compositions", icon: "movie" },
];

const palette = {
  black: "#100f0f",
  surface: "#1c1b1a",
  paper: "#f2f0e5",
  primary: "#ec8b49",
  soft: "#fcc192",
};
const lightBits = new Set([
  "bauhaus-tiles",
  "floating-shapes",
  "phyllotaxis-bloom",
  "ray-burst",
]);
const structuralBits = new Set([
  "fracture-reassemble",
  "mosaic-reframe",
  "ken-burns",
]);
const gradientThemes = {
  "conic-gradient": { color1: palette.black, color2: palette.primary },
  "linear-gradient": {
    color1Start: palette.black,
    color1End: "#343331",
    color2Start: palette.primary,
    color2End: "#551b18",
  },
  "radial-gradient": {
    color1Start: palette.primary,
    color1End: palette.black,
    color2Start: palette.soft,
    color2End: palette.surface,
  },
};

function declaredVariables(id) {
  const html = readFileSync(join(launchDir, `compositions/${id}.html`), "utf8");
  const match = html.match(/data-composition-variables='([^']*)'/);
  return match ? JSON.parse(match[1]) : [];
}

function themeFor(id) {
  if (structuralBits.has(id)) return {};
  if (gradientThemes[id]) return gradientThemes[id];
  const light = lightBits.has(id);
  const values = {};
  for (const variable of declaredVariables(id)) {
    if (variable.type !== "color") continue;
    const current = String(variable.default).toLowerCase();
    if (variable.id === "background")
      values.background = light
        ? palette.paper
        : current === palette.surface
          ? palette.surface
          : palette.black;
    else if (variable.id === "foreground")
      values.foreground = light ? palette.black : palette.paper;
    else if (variable.id === "accent") values.accent = palette.primary;
    else if (variable.id === "color")
      values.color = ["#fcc192", "#ec8b49", "#f6a45c"].includes(current)
        ? current
        : current === "#ffffff"
          ? palette.paper
          : palette.primary;
  }
  return values;
}

const DURATION = 36;
const DIVES = ["matrix-rain", "bauhaus-tiles", "wave-stack", "pinwheel-grid"];
const DIVE_ARRIVE = 13.0;
const DIVE_STEP = 2.15;
const diveMediaStart = {
  "matrix-rain": 2,
  "bauhaus-tiles": 2,
  "wave-stack": 3,
  "pinwheel-grid": 3,
};
const heroes = Object.fromEntries(
  DIVES.map((id, order) => {
    const arrive = DIVE_ARRIVE + order * DIVE_STEP;
    return [
      id,
      {
        start: round(arrive - 0.9),
        end: round(arrive + 1.85),
        mediaStart: diveMediaStart[id],
      },
    ];
  }),
);
heroes.carousel = { start: 23.8, end: 34, mediaStart: 0 };

const windows = [
  { start: 0, end: 12.2, cap: 4 },
  { start: 12.2, end: 28, cap: 2 },
  { start: 28, end: DURATION, cap: 3 },
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
      width: bit.width,
      height: bit.height,
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
  const fit = Math.max(480 / bit.width, 270 / bit.height);
  const placement = `width:${bit.width}px;height:${bit.height}px;transform:translate(${round((480 - bit.width * fit) / 2)}px,${round((270 - bit.height * fit) / 2)}px) scale(${round(fit)})`;
  const hosts = clipsFor(bit)
    .map(
      (span, clip) =>
        `<div class="lv-host" id="tile-${bit.id}-${clip}" style="${placement}" data-composition-id="tile-${bit.id}-${clip}" data-composition-src="compositions/${bit.id}.html" data-variable-values='${JSON.stringify(bit.theme)}' data-start="${round(span.start)}" data-media-start="${round(span.mediaStart)}" data-duration="${round(span.end - span.start)}" data-width="${bit.width}" data-height="${bit.height}"></div>`,
    )
    .join("");
  return `<div class="lv-tile" data-index="${index}" data-id="${bit.id}" data-category="${bit.category}">
          <div class="lv-card"><img class="lv-poster" src="public/posters/${bit.id}.jpg" alt="" />${hosts}<div class="lv-veil"></div><div class="lv-label">${bit.id}</div><div class="lv-sheen"></div><div class="lv-shade"></div><div class="lv-tint"></div></div>
          <div class="lv-ring"></div>
          <div class="lv-inspect"><div class="lv-outline"></div><div class="lv-tag">compositions/${bit.id}.html</div><div class="lv-dims">1920 × 1080</div></div>
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

for (const bit of bits) bit.theme = themeFor(bit.id);

const data = {
  categories: categories.map(({ label, icon }, index) => ({
    label,
    icon,
    count: bits.filter((bit) => bit.category === index).length,
  })),
  bits: bits.map(({ id, name, category }) => ({ id, name, category })),
  icons: JSON.parse(readFileSync(join(launchDir, "src/icons.json"), "utf8")),
  timing: {
    duration: DURATION,
    dives: DIVES,
    diveArrive: DIVE_ARRIVE,
    diveStep: DIVE_STEP,
  },
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
    (bit) =>
      refreshPosters ||
      !existsSync(join(launchDir, `public/posters/${bit.id}.jpg`)),
  );
  const workDir = join(launchDir, "out/posters");
  async function poster(bit) {
    const dir = join(workDir, bit.id);
    mkdirSync(dir, { recursive: true });
    const themed = readFileSync(
      join(launchDir, `compositions/${bit.id}.html`),
      "utf8",
    ).replace(
      /data-composition-variables='([^']*)'/,
      (whole, json) =>
        `data-composition-variables='${JSON.stringify(
          JSON.parse(json).map((variable) =>
            variable.id in bit.theme
              ? { ...variable, default: bit.theme[variable.id] }
              : variable,
          ),
        )}'`,
    );
    writeFileSync(join(dir, "index.html"), themed);
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
