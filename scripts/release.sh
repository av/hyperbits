#!/usr/bin/env bash
set -euo pipefail

# Cut a hyperbits release: bump, commit, tag, push. GitHub Actions does the rest
# (.github/workflows/release.yml runs every check, publishes to npm with
# provenance and creates the GitHub release). Nothing is published from here.
#
#   scripts/release.sh 0.3.0        explicit version
#   scripts/release.sh patch        or minor / major
#
# CHANGELOG.md: a "### Unreleased" heading is renamed to "### v<version>".

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VERSION_ARG="${1:-}"
if [[ -z "$VERSION_ARG" ]]; then
  echo "Usage: scripts/release.sh <version|patch|minor|major>" >&2
  exit 1
fi

if [[ "$(git rev-parse --abbrev-ref HEAD)" != "master" ]]; then
  echo "Release from master only." >&2
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean." >&2
  exit 1
fi
git pull --ff-only origin master

npm version --no-git-tag-version "$VERSION_ARG" >/dev/null
VERSION="$(node -p "require('./package.json').version")"
printf 'export const version = "%s";\n' "$VERSION" > src/version.ts

if grep -q '^### Unreleased$' CHANGELOG.md; then
  sed -i.bak "s/^### Unreleased$/### v${VERSION}/" CHANGELOG.md && rm -f CHANGELOG.md.bak
fi

git add package.json package-lock.json src/version.ts CHANGELOG.md
git commit -m "chore(release): ${VERSION}"
git tag -a "v${VERSION}" -m "hyperbits ${VERSION}"
git push origin master "v${VERSION}"

echo
echo "Pushed v${VERSION}. Follow the release at https://github.com/av/hyperbits/actions/workflows/release.yml"
