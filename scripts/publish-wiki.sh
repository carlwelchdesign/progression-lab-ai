#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${ROOT_DIR}/docs/wiki"

if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "Error: source directory not found: ${SOURCE_DIR}" >&2
  exit 1
fi

origin_url="$(git -C "${ROOT_DIR}" remote get-url origin)"

build_wiki_url() {
  local remote_url="$1"

  if [[ "${remote_url}" =~ ^git@github.com:([^/]+)/([^/.]+)(\.git)?$ ]]; then
    echo "git@github.com:${BASH_REMATCH[1]}/${BASH_REMATCH[2]}.wiki.git"
    return 0
  fi

  if [[ "${remote_url}" =~ ^https://github.com/([^/]+)/([^/.]+)(\.git)?$ ]]; then
    echo "https://github.com/${BASH_REMATCH[1]}/${BASH_REMATCH[2]}.wiki.git"
    return 0
  fi

  return 1
}

WIKI_REMOTE_URL="${WIKI_REMOTE_URL:-}"
if [[ -z "${WIKI_REMOTE_URL}" ]]; then
  if ! WIKI_REMOTE_URL="$(build_wiki_url "${origin_url}")"; then
    echo "Error: cannot derive wiki URL from origin remote: ${origin_url}" >&2
    echo "Set WIKI_REMOTE_URL explicitly and retry." >&2
    exit 1
  fi
fi

COMMIT_MESSAGE="${1:-docs(wiki): sync from docs/wiki}"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/wiki-publish.XXXXXX")"
trap 'rm -rf "${TMP_DIR}"' EXIT

echo "Cloning wiki repository: ${WIKI_REMOTE_URL}"
git clone "${WIKI_REMOTE_URL}" "${TMP_DIR}" >/dev/null

rsync -a --delete --exclude '.git/' "${SOURCE_DIR}/" "${TMP_DIR}/"

pushd "${TMP_DIR}" >/dev/null
if git diff --quiet --exit-code; then
  echo "No wiki changes to publish."
  popd >/dev/null
  exit 0
fi

git add .
git commit -m "${COMMIT_MESSAGE}"
git push origin HEAD
popd >/dev/null

echo "Wiki published successfully from ${SOURCE_DIR}."
