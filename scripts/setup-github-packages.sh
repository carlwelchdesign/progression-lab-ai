#!/usr/bin/env bash

set -euo pipefail

# Generate .npmrc dynamically with GITHUB_TOKEN if available
# This runs before yarn install so the token is available at parse time

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "WARNING: GITHUB_TOKEN not set; GitHub Packages auth may fail"
  # Fallback: create .npmrc without token (fails gracefully if package download needed)
  echo "//npm.pkg.github.com/:_authToken=" > .npmrc
  echo "//npm.pkg.github.com/:_authToken=" > admin-dashboard/.npmrc
else
  echo "Configuring GitHub Packages auth with GITHUB_TOKEN..."
  echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" > .npmrc
  echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" > admin-dashboard/.npmrc
fi

echo "✓ .npmrc configured"
