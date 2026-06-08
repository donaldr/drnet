#!/usr/bin/env bash
#
# Compress the work videos with ffmpeg (via the ffmpeg-static devDependency).
#
# NON-DESTRUCTIVE: reads from public/work, writes to public/work-compressed,
# mirroring the directory structure. Originals are never touched — compare the
# output, and only then replace the originals / re-upload to Vercel Blob.
#
# Usage:
#   bash scripts/compress-videos.sh                 # compress ALL mp4s under public/work
#   bash scripts/compress-videos.sh path/a.mp4 ...  # only the given files
#   CRF=26 PRESET=slow bash scripts/compress-videos.sh   # override quality/speed
#
# Knobs:
#   CRF    18 = near-lossless, 23 = high quality (default), 26-28 = smaller files
#   PRESET slower preset = better compression for the same quality (default: slow)
#   FPS    cap frame rate (e.g. FPS=30). Empty = keep source fps. Only decimates.
#
set -euo pipefail

FFMPEG="$(node -e "process.stdout.write(require('ffmpeg-static'))")"
SRC_DIR="public/work"
OUT_DIR="public/work-compressed"
CRF="${CRF:-23}"
PRESET="${PRESET:-slow}"
FPS="${FPS:-}"

fps_arg=()
[ -n "$FPS" ] && fps_arg=(-vf "fps=$FPS")

mb() { awk "BEGIN{printf \"%.1f MB\", $1/1048576}"; }
pct() { awk "BEGIN{printf \"%.0f%%\", (1-$2/$1)*100}"; }

echo "ffmpeg : $FFMPEG"
echo "CRF=$CRF  PRESET=$PRESET  FPS=${FPS:-source}  (audio re-encoded AAC 128k, +faststart for web)"
echo

# Build the file list: explicit args, or every mp4 under public/work.
files=()
if [ "$#" -gt 0 ]; then
  files=("$@")
else
  while IFS= read -r -d '' f; do files+=("$f"); done \
    < <(find "$SRC_DIR" -type f -iname "*.mp4" -print0)
fi

total_in=0
total_out=0
for f in "${files[@]}"; do
  rel="${f#"$SRC_DIR"/}"
  out="$OUT_DIR/$rel"
  mkdir -p "$(dirname "$out")"

  echo "==> $rel"
  "$FFMPEG" -y -hide_banner -loglevel error -stats -i "$f" \
    -c:v libx264 -preset "$PRESET" -crf "$CRF" \
    "${fps_arg[@]}" \
    -pix_fmt yuv420p -movflags +faststart \
    -c:a aac -b:a 128k \
    "$out"

  in_size=$(stat -c%s "$f")
  out_size=$(stat -c%s "$out")
  total_in=$((total_in + in_size))
  total_out=$((total_out + out_size))
  echo "    $(mb "$in_size") -> $(mb "$out_size")  ($(pct "$in_size" "$out_size") smaller)"
  echo
done

echo "=================================================="
echo "TOTAL: $(mb "$total_in") -> $(mb "$total_out")  ($(pct "$total_in" "$total_out") smaller)"
echo "Output: $OUT_DIR/  (originals untouched)"
