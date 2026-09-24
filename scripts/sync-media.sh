#!/usr/bin/env bash
# Upload every media/*.mp4 to the R2 bucket the Worker serves videos from.
# Run this BEFORE `npx wrangler deploy` whenever a clip is added or replaced,
# otherwise R2 keeps serving the old bytes under the same URL.
set -euo pipefail
cd "$(dirname "$0")/.."
BUCKET=swampcityrecs-media
for f in media/*.mp4; do
  echo "-> $BUCKET/$f"
  npx wrangler r2 object put "$BUCKET/$f" --file "$f" --content-type video/mp4 --remote
done
