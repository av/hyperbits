#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { copyFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bitsRoot = path.join(root, "bits");
const runCheck =
  process.argv.includes("--check") || process.argv.includes("--audit");

function listBitDirs(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const indexHtml = path.join(full, "index.html");
      if (statSync(indexHtml, { throwIfNoEntry: false })?.isFile()) {
        out.push(full);
      } else {
        out.push(...listBitDirs(full));
      }
    }
  }
  return out.sort();
}

function runHyperframes(command, bitDir) {
  const args = ["hyperframes", command, "--json", bitDir];
  const result = spawnSync("npx", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  return result;
}

function summarizeLint(payload, bitDir) {
  const relative = path.relative(root, bitDir);
  if (!payload || typeof payload !== "object") {
    return { ok: false, line: `${relative}: invalid lint JSON` };
  }
  const totalErrors = payload.totalErrors ?? payload.errorCount ?? 0;
  const totalWarnings = payload.totalWarnings ?? payload.warningCount ?? 0;
  const ok = payload.ok === true || totalErrors === 0;
  return {
    ok,
    line: `${relative}: ${ok ? "ok" : "FAIL"} errors=${totalErrors} warnings=${totalWarnings}`,
  };
}

const bitDirs = listBitDirs(bitsRoot);
if (bitDirs.length === 0) {
  console.error("No bits found under bits/**/index.html");
  process.exit(1);
}

const iifeSrc = path.join(root, "dist", "hyperbits.iife.js");
if (!statSync(iifeSrc, { throwIfNoEntry: false })?.isFile()) {
  console.error("dist/hyperbits.iife.js is missing. Run npm run build first.");
  process.exit(1);
}

let failed = 0;
for (const bitDir of bitDirs) {
  copyFileSync(iifeSrc, path.join(bitDir, "hyperbits.iife.js"));
  const lint = runHyperframes("lint", bitDir);
  let payload = null;
  try {
    const stdout = lint.stdout || "";
    const start = stdout.indexOf("{");
    const end = stdout.lastIndexOf("}");
    payload = JSON.parse(start >= 0 ? stdout.slice(start, end + 1) : "null");
  } catch {
    payload = null;
  }
  const summary = summarizeLint(payload, bitDir);
  if (lint.status !== 0 || !summary.ok) {
    failed += 1;
    console.error(summary.line);
    if (lint.stderr) console.error(lint.stderr.trim());
    if (lint.stdout && !payload) console.error(lint.stdout.trim());
    const findings = [];
    if (Array.isArray(payload?.findings)) findings.push(...payload.findings);
    if (Array.isArray(payload?.results)) {
      for (const fileResult of payload.results) {
        findings.push(...(fileResult.result?.findings ?? []));
      }
    }
    for (const finding of findings) {
      if (finding.severity === "error") {
        console.error(`  [${finding.code}] ${finding.message}`);
      }
    }
  } else {
    console.log(summary.line);
  }

  if (runCheck) {
    const check = runHyperframes("check", bitDir);
    if (check.status !== 0) {
      failed += 1;
      console.error(`${path.relative(root, bitDir)}: check failed`);
      if (check.stderr) console.error(check.stderr.trim());
      if (check.stdout) console.error(check.stdout.slice(0, 4000));
    }
  }
}

if (failed > 0) {
  console.error(`lint-bits: ${failed}/${bitDirs.length} failed`);
  process.exit(1);
}

console.log(`lint-bits: ${bitDirs.length} bits passed`);
