#!/usr/bin/env bash

set -Eeuo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
build_cache="$project_dir/.build-cache"
venv_dir="$build_cache/mineru-venv"
runtime_dir="$build_cache/python-standalone-arm64"
mineru_dir="$build_cache/mineru"
python_release="20260825"
python_version="3.12.14"
python_sha256="8b0f1fa71eab7ca644e482c631807a1116fa848491051cd1c8d9429491de63a6"
python_archive="$build_cache/cpython-${python_version}-arm64.tar.gz"
python_url="https://github.com/astral-sh/python-build-standalone/releases/download/${python_release}/cpython-${python_version}%2B${python_release}-aarch64-apple-darwin-install_only_stripped.tar.gz"

if [[ "$(uname -s)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  echo "Error: the bundled MinerU runtime currently requires Apple Silicon macOS." >&2
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: Python 3 is required to prepare MinerU." >&2
  exit 1
fi
if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is required to download the portable Python runtime." >&2
  exit 1
fi

mkdir -p "$build_cache"
if [[ ! -x "$venv_dir/bin/mineru" ]]; then
  echo "Installing MinerU 3.4.5 into the build cache..."
  python3 -m venv "$venv_dir"
  "$venv_dir/bin/python" -m pip install --upgrade pip
  "$venv_dir/bin/python" -m pip install --upgrade "mineru[all]==3.4.5"
fi

if [[ ! -f "$python_archive" ]]; then
  echo "Downloading portable Python ${python_version}..."
  curl --fail --location --retry 3 "$python_url" --output "$python_archive"
fi
actual_sha256="$(shasum -a 256 "$python_archive" | awk '{print $1}')"
if [[ "$actual_sha256" != "$python_sha256" ]]; then
  echo "Error: portable Python checksum mismatch." >&2
  exit 1
fi
if [[ ! -x "$runtime_dir/bin/python3" ]]; then
  temporary_runtime="$(mktemp -d "$build_cache/python-runtime.XXXXXX")"
  tar -xzf "$python_archive" -C "$temporary_runtime" --strip-components=1
  mv "$temporary_runtime" "$runtime_dir"
fi

echo "Installing MinerU packages into the portable Python runtime..."
ditto "$venv_dir/lib/python3.12/site-packages" \
  "$runtime_dir/lib/python3.12/site-packages"

model_root="$mineru_dir/models/models/OpenDataLab--PDF-Extract-Kit-1.0/snapshots/master"
if [[ ! -d "$model_root/models" ]]; then
  echo "Downloading MinerU pipeline models from ModelScope..."
  mkdir -p "$mineru_dir"
  MINERU_TOOLS_CONFIG_JSON="$mineru_dir/mineru.json" \
    MODELSCOPE_CACHE="$mineru_dir/models" \
    MINERU_MODEL_SOURCE="modelscope" \
    "$venv_dir/bin/mineru-models-download" \
      --source modelscope \
      --model_type pipeline
fi

"$runtime_dir/bin/python3" -m mineru.cli.client --version
echo "MinerU runtime: $runtime_dir"
echo "MinerU models: $model_root"
