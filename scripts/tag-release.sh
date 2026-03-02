#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly MANIFEST="${SCRIPT_DIR}/../manifest.json"

version="$(jq -r '.version' "${MANIFEST}")"

if [[ -z "${version}" || "${version}" == "null" ]]; then
  printf 'Error: could not read version from manifest.json\n' >&2
  exit 1
fi

tag="v${version}"

if git tag --list | grep -qx "${tag}"; then
  printf 'Warning: tag %s already exists\n' "${tag}" >&2
  exit 1
fi

git tag "${tag}"
printf 'Created tag %s\n' "${tag}"

printf 'Push with: git push origin %s\n' "${tag}"
