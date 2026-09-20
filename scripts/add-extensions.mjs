#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const distDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist",
);

const addExtensionsToFile = (filePath) => {
  let content = fs.readFileSync(filePath, "utf8");
  const originalContent = content;
  const fileDir = path.dirname(filePath);

  content = content.replace(
    /from\s+["'](\.[^"']*?)["']/g,
    (match, importPath) => {
      if (/\.(js|ts|jsx|tsx|json)['"]$/.test(match)) {
        return match;
      }
      if (!importPath.startsWith(".")) {
        return match;
      }

      const resolvedPath = path.resolve(fileDir, importPath);
      const stats = fs.existsSync(resolvedPath)
        ? fs.statSync(resolvedPath)
        : null;

      if (stats?.isDirectory()) {
        return `from "${importPath}/index.js"`;
      }

      return `from "${importPath}.js"`;
    },
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf8");
  }
};

const processDirectory = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.name.endsWith(".js") && !entry.name.endsWith(".d.ts")) {
      addExtensionsToFile(fullPath);
    }
  }
};

if (!fs.existsSync(distDir)) {
  console.error(`dist directory not found at ${distDir}`);
  process.exit(1);
}

processDirectory(distDir);
