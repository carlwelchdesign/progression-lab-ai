#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${NPM_TOKEN:-}" ]]; then
  cat <<'EOF'
ERROR: NPM_TOKEN is not set.

This project installs @carlwelchdesign/webauthn-core from GitHub Packages.
Set NPM_TOKEN in Vercel Project Settings -> Environment Variables.
EOF
  exit 1
fi

token="${NPM_TOKEN}"

if [[ "${token}" =~ [[:space:]] ]]; then
  cat <<'EOF'
ERROR: NPM_TOKEN contains whitespace or a newline.

Use only the raw GitHub token value with no spaces or line breaks.
EOF
  exit 1
fi

if [[ "${token}" == \"*\" || "${token}" == "'*'" ]]; then
  cat <<'EOF'
ERROR: NPM_TOKEN appears to include wrapping quotes.

Paste the raw token only (do not include single or double quotes).
EOF
  exit 1
fi

if [[ "${token}" == "Bearer "* || "${token}" == "token "* ]]; then
  cat <<'EOF'
ERROR: NPM_TOKEN appears to include a prefix.

Paste only the token value (no "Bearer " or "token " prefix).
EOF
  exit 1
fi

echo "NPM_TOKEN format check passed."