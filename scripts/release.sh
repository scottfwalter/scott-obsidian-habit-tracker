#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly MANIFEST="${SCRIPT_DIR}/../manifest.json"

# --- Read version from manifest ---
version="$(jq -r '.version' "${MANIFEST}")"

if [[ -z "${version}" || "${version}" == "null" ]]; then
  printf 'Error: could not read version from manifest.json\n' >&2
  exit 1
fi

tag="v${version}"
echo "Version: ${tag}"

# --- Tag ---
git fetch --tags --quiet

if git tag --list | grep -qx "${tag}"; then
  echo "Tag ${tag} already exists locally."
else
  git tag "${tag}"
  git push origin "${tag}"
  printf 'Created and pushed tag %s\n' "${tag}"
fi

# --- Release ---
if gh release view "${tag}" &>/dev/null; then
  echo "Release already exists for ${tag}. Nothing to do."
  exit 0
fi

read -r -p "No release found for ${tag}. Create one? [y/N] " answer
if [[ "${answer}" =~ ^[Yy]$ ]]; then
  gh release create "${tag}" --generate-notes \
    "${SCRIPT_DIR}/../main.js" \
    "${SCRIPT_DIR}/../manifest.json"
else
  echo "Aborted."
fi
