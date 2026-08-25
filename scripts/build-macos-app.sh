#!/usr/bin/env bash

set -Eeuo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="${1:-$project_dir/dist}"
app_name="Circo.app"
app_path="$output_dir/$app_name"
build_cache="$project_dir/.build-cache"
node_version="${CIRCO_NODE_VERSION:-20.19.0}"
sign_identity="${CIRCO_SIGN_IDENTITY:--}"
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
if ! command -v npm >/dev/null 2>&1; then
  echo "Error: Node.js and npm are required to build Circo.app." >&2
  exit 1
fi

case "$(uname -m)" in
  arm64) node_arch="arm64" ;;
  x86_64) node_arch="x64" ;;
  *)
    echo "Error: unsupported macOS architecture: $(uname -m)" >&2
    exit 1
    ;;
esac

node_dist="node-v${node_version}-darwin-${node_arch}"
node_archive="$build_cache/${node_dist}.tar.xz"
if [[ ! -f "$node_archive" ]]; then
  if ! command -v curl >/dev/null 2>&1; then
    echo "Error: curl is required to download the portable Node.js runtime." >&2
    exit 1
  fi
  mkdir -p "$build_cache"
  echo "Downloading portable Node.js ${node_version} (${node_arch})..."
  curl --fail --location --retry 3 \
    "https://nodejs.org/dist/v${node_version}/${node_dist}.tar.xz" \
    --output "$node_archive"
fi

echo "Building the production Next.js application..."
(cd "$project_dir" && npm run build)
if [[ ! -f "$project_dir/.next/standalone/server.js" ]]; then
  echo "Error: Next.js standalone server was not generated." >&2
  exit 1
fi

tar -xJf "$node_archive" -C "$temporary_dir"

mkdir -p \
  "$temporary_app/Contents/MacOS" \
  "$temporary_app/Contents/Resources/runtime" \
  "$temporary_app/Contents/Resources/server/.next" \
  "$temporary_app/Contents/Resources/models"
cp "$project_dir/macos/CircoApp/Info.plist" "$temporary_app/Contents/Info.plist"

cp "$temporary_dir/$node_dist/bin/node" \
  "$temporary_app/Contents/Resources/runtime/node"
cp "$project_dir/.next/standalone/server.js" \
  "$temporary_app/Contents/Resources/server/server.js"
LC_ALL=C sed -i '' "s|$project_dir|.|g" \
  "$temporary_app/Contents/Resources/server/server.js"
cp "$project_dir/.next/standalone/package.json" \
  "$temporary_app/Contents/Resources/server/package.json"
cp -R "$project_dir/.next/standalone/node_modules" \
  "$temporary_app/Contents/Resources/server/node_modules"
cp -R "$project_dir/.next/standalone/.next/." \
  "$temporary_app/Contents/Resources/server/.next/"
cp -R "$project_dir/.next/static" \
  "$temporary_app/Contents/Resources/server/.next/static"
if [[ -d "$project_dir/public" ]]; then
  cp -R "$project_dir/public" "$temporary_app/Contents/Resources/server/public"
fi
if [[ -d "$project_dir/data/models" ]]; then
  cp -R "$project_dir/data/models/." \
    "$temporary_app/Contents/Resources/models/"
fi

swiftc -O -framework AppKit -framework WebKit \
  "$project_dir/macos/CircoApp/main.swift" \
  "$project_dir/macos/CircoApp/CircoWindowController.swift" \
  "$project_dir/macos/CircoApp/CircoWindowController+JavaScriptDialogs.swift" \
  -o "$temporary_app/Contents/MacOS/Circo"
swiftc -O -framework AppKit \
  "$project_dir/macos/CircoApp/IconGenerator.swift" \
  -o "$temporary_dir/icon-generator"
"$temporary_dir/icon-generator" "$temporary_app/Contents/Resources/Circo.icns"

if [[ "$sign_identity" == "-" ]]; then
  codesign --force --deep --sign - "$temporary_app" >/dev/null
else
  codesign --force --deep --options runtime --timestamp \
    --sign "$sign_identity" "$temporary_app" >/dev/null
fi
mkdir -p "$output_dir"
if [[ -e "$app_path" ]]; then
  rm -rf "$app_path"
fi
mv "$temporary_app" "$app_path"

archive_path="$output_dir/Circo-macOS-${node_arch}.zip"
rm -f "$archive_path"
ditto -c -k --sequesterRsrc --keepParent "$app_path" "$archive_path"

echo "Built: $app_path"
echo "Share: $archive_path"
echo "Web app: http://localhost:1204"
echo "User data: ~/Library/Application Support/Circo/data"
