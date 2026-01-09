#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
ROOT_DIR="$(cd -- "${SCRIPT_DIR}/.." &>/dev/null && pwd)"

SERVER_HOST="${1:-}"
if [[ -z "${SERVER_HOST}" ]]; then
  echo "Usage: $0 user@host"
  exit 1
fi

KEY_PATH="${KEY_PATH:-${HOME}/.ssh/oci_key.pem}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://typing.youwillspeakkorean.com}"
ARCHIVE="/tmp/typing-game-update.tar.gz"

cd "${ROOT_DIR}"
npm run build

tar -czf "${ARCHIVE}" \
  dist/ \
  server/ \
  packs/ \
  .dockerignore

scp -i "${KEY_PATH}" "${ARCHIVE}" "${SERVER_HOST}:~/typing-game-update.tar.gz"

ssh -i "${KEY_PATH}" "${SERVER_HOST}" <<EOF
set -e
mkdir -p ~/typing-app
cd ~/typing-app
tar -xzf ~/typing-game-update.tar.gz
docker build -t typing-server:latest -f server/Dockerfile .
docker stop typing-server || true
docker rm typing-server || true
docker run -d \
  --name typing-server \
  --restart unless-stopped \
  -p 5003:5003 \
  -v ~/typing-app/packs:/app/packs \
  -e PUBLIC_BASE_URL=${PUBLIC_BASE_URL} \
  typing-server:latest
EOF
