#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
BASE_URL="${BASE_URL:-http://localhost:5003}"

curl -sS -X POST "${BASE_URL}/api/create-pack-and-redirect" \
  -H "Content-Type: application/json" \
  --data-binary "@${SCRIPT_DIR}/mock-pack.json"
