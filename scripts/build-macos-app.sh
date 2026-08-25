#!/usr/bin/env bash

set -Eeuo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="${1:-$project_dir/dist}"
app_name="Circo.app"
app_path="$output_dir/$app_name"
temporary_dir="$(mktemp -d)"
temporary_app="$temporary_dir/$app_name"
export CLANG_MODULE_CACHE_PATH="$temporary_dir/clang-module-cache"
export SWIFT_MODULECACHE_PATH="$temporary_dir/swift-module-cache"

cleanup() {
  rm -rf "$temporary_dir"
}
trap cleanup EXIT

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: Circo.app can only be built on macOS." >&2
  exit 1
fi
if ! command -v swiftc >/dev/null 2>&1; then
  echo "Error: install Xcode Command Line Tools first." >&2
  exit 1
fi

mkdir -p "$temporary_app/Contents/MacOS" "$temporary_app/Contents/Resources"
cp "$project_dir/macos/CircoApp/Info.plist" "$temporary_app/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CircoProjectPath $project_dir" \
  "$temporary_app/Contents/Info.plist"

swiftc -O -framework AppKit -framework WebKit \
  "$project_dir/macos/CircoApp/main.swift" \
  "$project_dir/macos/CircoApp/CircoWindowController.swift" \
  -o "$temporary_app/Contents/MacOS/Circo"
swiftc -O -framework AppKit \
  "$project_dir/macos/CircoApp/IconGenerator.swift" \
  -o "$temporary_dir/icon-generator"
"$temporary_dir/icon-generator" "$temporary_app/Contents/Resources/Circo.icns"

codesign --force --deep --sign - "$temporary_app" >/dev/null
mkdir -p "$output_dir"
if [[ -e "$app_path" ]]; then
  rm -rf "$app_path"
fi
mv "$temporary_app" "$app_path"

echo "Built: $app_path"
echo "Web app: http://localhost:1204"
echo "Project: $project_dir"
