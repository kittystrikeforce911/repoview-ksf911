#!/bin/bash
set -euo pipefail

# # # # # # # # # # # # # # # # # # # # #
#					#
#  golang builder conf:repoview-ksf911	#
#					#
# # # # # # # # # # # # # # # # # # # # #
#
# go-releaser.sh — build the release assets locally
#
# Same GOOS/GOARCH matrix as .github/workflows/release.yml, with the exact
# artifact names the install.* files download:
#
#   repoview-{linux,darwin}-{amd64,arm64}.tar.gz   top-level binary: repoview
#   repoview-windows-{amd64,arm64}.zip             top-level binary: repoview.exe
#
# Usage:
#   ./go-releaser.sh            # version = latest v* tag, or "dev"
#   ./go-releaser.sh 0.0.5      # explicit version stamp
#
# Artifacts land in dist/. The script never commits, tags or pushes.

OUT=dist

# Version stamp: argument beats git; fall back to "dev" without tags.
VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  LATEST=$(git tag -l 'v*' | sort -V | tail -n1)
  VERSION="${LATEST#v}"
fi
VERSION="${VERSION:-dev}"

echo "Building repoview v${VERSION} -> ${OUT}/"

rm -rf "$OUT"
mkdir -p "$OUT"

for pair in darwin/amd64 darwin/arm64 linux/amd64 linux/arm64; do
  OS="${pair%/*}"
  ARCH="${pair#*/}"
  echo "  GOOS=${OS} GOARCH=${ARCH} go build ."
  GOOS="${OS}" GOARCH="${ARCH}" go build -ldflags "-X main.version=${VERSION}" -o repoview .
  tar czf "${OUT}/repoview-${OS}-${ARCH}.tar.gz" repoview
  rm repoview
done

for pair in windows/amd64 windows/arm64; do
  OS="${pair%/*}"
  ARCH="${pair#*/}"
  echo "  GOOS=${OS} GOARCH=${ARCH} go build ."
  GOOS="${OS}" GOARCH="${ARCH}" go build -ldflags "-X main.version=${VERSION}" -o repoview.exe .
  # `zip` is not part of the base toolchain here; python3's stdlib zipfile
  # module writes the same archive the CI step produces.
  python3 -m zipfile -c "${OUT}/repoview-${OS}-${ARCH}.zip" repoview.exe
  rm repoview.exe
done

echo ""
ls -la "$OUT"
