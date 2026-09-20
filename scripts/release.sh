#!/usr/bin/env bash
set -euo pipefail

# Prepare a hyperbits release. Does not publish.
#
#   scripts/release.sh              run the full check set
#   scripts/release.sh 0.1.1        checks, then bump package.json and src/version.ts
#   scripts/release.sh patch        same, using npm version's increment keywords
#
# After a bump, commit and tag, then publish yourself:
#   npm publish --access public

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VERSION_ARG="${1:-}"

run_checks() {
  npm run build
  npm run typecheck
  npm run lint
  npm test
  npm run test:package
  npm run check:generated
  npm run docs:build
  npm pack --dry-run
}

run_checks

if [[ -z "$VERSION_ARG" ]]; then
  echo
  echo "Checks passed. This script does not publish."
  echo "Bump with:  scripts/release.sh <version|patch|minor|major>"
  echo "Publish with:  npm publish --access public"
  exit 0
fi

npm version --no-git-tag-version "$VERSION_ARG"

ACTUAL="$(node -p "require('./package.json').version")"
node --input-type=module -e "
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { version } = require('./package.json');
writeFileSync('src/version.ts', \`export const version = \${JSON.stringify(version)};\\n\`);
"

echo
echo "Version set to ${ACTUAL} (package.json, package-lock.json, src/version.ts)."
echo "Commit, then publish with:  npm publish --access public"
echo "Do not push until publish succeeds."
