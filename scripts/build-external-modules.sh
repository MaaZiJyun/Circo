#!/usr/bin/env bash

set -Eeuo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
build_cache="$project_dir/.build-cache"
output_dir="${1:-$project_dir/dist}"
modules_name="Circo-modules-macOS-arm64"
modules_path="$output_dir/$modules_name"
temporary_dir="$(mktemp -d)"
temporary_modules="$temporary_dir/$modules_name"
mineru_runtime="$build_cache/python-standalone-arm64"
mineru_models="$build_cache/mineru/models/models/OpenDataLab--PDF-Extract-Kit-1.0/snapshots/master"
translation_models="$project_dir/data/models"

cleanup() { rm -rf "$temporary_dir"; }
trap cleanup EXIT

if [[ "$(uname -s)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  echo "Error: the current MinerU module package requires Apple Silicon macOS." >&2
  exit 1
fi
if [[ ! -x "$mineru_runtime/bin/python3" || ! -d "$mineru_models/models" ]]; then
  echo "Error: run npm run mineru:prepare first." >&2
  exit 1
fi
if [[ ! -d "$translation_models/Xenova/opus-mt-en-zh" || ! -d "$translation_models/Xenova/opus-mt-zh-en" ]]; then
  echo "Error: run npm run models:download first." >&2
  exit 1
fi

mkdir -p \
  "$temporary_modules/translation" \
  "$temporary_modules/mineru/models"
echo "Packaging translation module..."
ditto "$translation_models" "$temporary_modules/translation/models"
echo "Packaging MinerU module..."
ditto "$mineru_runtime" "$temporary_modules/mineru/runtime"
ditto "$mineru_models" "$temporary_modules/mineru/models/pipeline"
cp "$project_dir/scripts/mineru-launcher.sh" "$temporary_modules/mineru/mineru"
chmod +x "$temporary_modules/mineru/mineru"

printf '%s\n' \
  '{' \
  '  "format": "circo-external-modules",' \
  '  "version": 1,' \
  '  "architecture": "arm64",' \
  '  "modules": { "translation": "opus-mt-q8", "mineru": "3.4.5-pipeline" }' \
  '}' > "$temporary_modules/circo-modules.json"

mkdir -p "$output_dir"
if [[ -e "$modules_path" ]]; then rm -rf "$modules_path"; fi
mv "$temporary_modules" "$modules_path"
archive_path="$output_dir/${modules_name}.zip"
rm -f "$archive_path"
ditto -c -k --sequesterRsrc --keepParent "$modules_path" "$archive_path"
echo "Modules: $modules_path"
echo "Share: $archive_path"
