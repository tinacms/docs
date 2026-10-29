#!/usr/bin/env bash
#
# Vercel "Ignored Build Step" command.
#   exit 0  -> SKIP the build
#   exit 1  -> PROCEED with the build
#
# Wire this up in: Vercel Project Settings -> Git -> Ignored Build Step
#   Command:  bash scripts/vercel-ignore-build.sh
#
# Goal: stop spending build minutes on PREVIEW deployments for the translation
# bot's branches (translate-pr-<PR>-<timestamp>), which nobody reviews directly.
# Production (main) and human PR branches always build.

set -euo pipefail

echo "VERCEL_ENV=${VERCEL_ENV:-} VERCEL_GIT_COMMIT_REF=${VERCEL_GIT_COMMIT_REF:-}"

# Always build production deployments.
if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "Production deployment — building."
  exit 1
fi

# Skip preview builds for translation bot branches.
case "${VERCEL_GIT_COMMIT_REF:-}" in
  translate-pr-*)
    echo "Translation bot preview (${VERCEL_GIT_COMMIT_REF}) — skipping build."
    exit 0
    ;;
esac

echo "Building."
exit 1
