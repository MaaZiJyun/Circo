#!/bin/sh

set -eu

mineru_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
exec "$mineru_dir/runtime/bin/python3" -m mineru.cli.client "$@"
