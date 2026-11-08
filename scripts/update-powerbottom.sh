#!/usr/bin/env bash
# Replaces vendor/powerbottom with a powerbottom release: the WebAssembly build
# and fonts the server draws Word and PowerPoint pages with. The repository is
# private, so this needs `gh` signed in with read access to it.
#
#   scripts/update-powerbottom.sh v0.4.0
set -euo pipefail

tag="${1:?usage: scripts/update-powerbottom.sh <tag>}"
out="$(cd "$(dirname "$0")/.." && pwd)/vendor/powerbottom"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

gh release download "$tag" -R mixedbread-ai/powerbottom -D "$work"
(cd "$work" && shasum -a 256 -c SHA256SUMS)

rm -rf "$out"
mkdir -p "$out/fonts"
tar xzf "$work/powerbottom-wasm-$tag.tar.gz" -C "$out"
tar xzf "$work/powerbottom-fonts-$tag.tar.gz" -C "$out/fonts"
# The browser demo's worker; the server calls the bindings itself
rm "$out/worker.js"
