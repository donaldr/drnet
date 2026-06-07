#!/usr/bin/env bash
#
# Extract a lean poster frame from each work video (via ffmpeg-static).
# Posters are what the visitor sees while the video buffers, so they should be
# small and load fast. Output is WebP, ~1280px wide, into public/work-posters/
# mirroring the source paths. Upload these to Vercel Blob and wire the URLs into
# data.*.json as `poster` (main video) / `heroPoster` (hero clip).
#
# Usage:
#   bash scripts/generate-posters.sh                 # all mp4s under public/work
#   bash scripts/generate-posters.sh path/a.mp4 ...  # only the given files
#   SS=2 WIDTH=1280 QUALITY=72 bash scripts/generate-posters.sh
#
# Knobs:
#   SS       timestamp (seconds) to grab the frame from (default 1, avoids black intros)
#   WIDTH    poster width in px (default 1280)
#   QUALITY  WebP quality 0-100 (default 72)
#
set -euo pipefail

FFMPEG="$(node -e "process.stdout.write(require('ffmpeg-static'))")"
SRC_DIR="public/work"
OUT_DIR="public/work-posters"
SS="${SS:-1}"
WIDTH="${WIDTH:-1280}"
QUALITY="${QUALITY:-72}"

kb() { awk "BEGIN{printf \"%.0f KB\", $1/1024}"; }

echo "ffmpeg : $FFMPEG"
echo "SS=$SS  WIDTH=$WIDTH  QUALITY=$QUALITY"
echo

files=()
if [ "$#" -gt 0 ]; then
  files=("$@")
else
  while IFS= read -r -d '' f; do files+=("$f"); done \
    < <(find "$SRC_DIR" -type f -iname "*.mp4" -print0)
fi

for f in "${files[@]}"; do
  rel="${f#"$SRC_DIR"/}"
  out="$OUT_DIR/${rel%.mp4}.webp"
  mkdir -p "$(dirname "$out")"
  echo "==> $rel"
  "$FFMPEG" -y -hide_banner -loglevel error -ss "$SS" -i "$f" \
    -frames:v 1 -vf "scale=$WIDTH:-2" -c:v libwebp -quality "$QUALITY" \
    "$out"
  echo "    $(kb "$(stat -c%s "$out")")  -> $out"
done
echo
echo "Done. Output: $OUT_DIR/"
