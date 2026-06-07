#!/usr/bin/env bash
#
# Generate an HLS (H.264) adaptive ladder for each work video, via ffmpeg-static.
#
# Input defaults to the already-compressed masters (public/work-compressed), so
# run scripts/compress-videos.sh first. Output is public/work-hls/<name>/ with a
# master.m3u8 + per-rung playlists (v0/v1/v2 = 1080p/720p/360p) and .ts segments.
#
# H.264 segments => plays in every browser (Safari native, others via hls.js).
# Upload each <name>/ folder to Vercel Blob preserving structure, then point
# data.*.json `videoHls`/`heroHls` at the master.m3u8 URL (keep mp4 as fallback).
#
# Usage:
#   bash scripts/generate-hls.sh                       # all mp4s under SRC_DIR
#   bash scripts/generate-hls.sh public/work-compressed/aic/video.mp4 ...
#   SRC_DIR=public/work PRESET=medium bash scripts/generate-hls.sh
#
set -euo pipefail

FFMPEG="$(node -e "process.stdout.write(require('ffmpeg-static'))")"
SRC_DIR="${SRC_DIR:-public/work-compressed}"
OUT_DIR="${OUT_DIR:-public/work-hls}"
PRESET="${PRESET:-slow}"
# 4s segments, keyframe-aligned regardless of source fps.
KEY="expr:gte(t,n_forced*4)"

echo "ffmpeg : $FFMPEG"
echo "src=$SRC_DIR  out=$OUT_DIR  preset=$PRESET  ladder=1080/720/360 (H.264)"
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
  out="$OUT_DIR/${rel%.mp4}"
  mkdir -p "$out"
  echo "==> $rel"

  # `ffmpeg -i` with no output exits non-zero, which would trip pipefail in a
  # pipe — capture to a var first, then glob-match (no pipe involved).
  probe="$("$FFMPEG" -hide_banner -i "$f" 2>&1 || true)"
  has_audio=false
  case "$probe" in *"Audio:"*) has_audio=true ;; esac

  # Shared video ladder args.
  vargs=(
    -filter_complex "[0:v]split=3[v1][v2][v3];[v1]scale=-2:1080[v1o];[v2]scale=-2:720[v2o];[v3]scale=-2:360[v3o]"
    -map "[v1o]" -map "[v2o]" -map "[v3o]"
    -c:v libx264 -preset "$PRESET" -profile:v main -force_key_frames "$KEY"
    -b:v:0 0 -crf:v:0 23 -maxrate:v:0 4000k -bufsize:v:0 8000k
    -b:v:1 0 -crf:v:1 24 -maxrate:v:1 2000k -bufsize:v:1 4000k
    -b:v:2 0 -crf:v:2 26 -maxrate:v:2 700k  -bufsize:v:2 1400k
  )

  if $has_audio; then
    "$FFMPEG" -y -hide_banner -loglevel error -i "$f" \
      "${vargs[@]}" \
      -map 0:a -map 0:a -map 0:a -c:a aac -b:a 128k -ac 2 \
      -f hls -hls_time 4 -hls_playlist_type vod -hls_flags independent_segments \
      -hls_segment_filename "$out/v%v_seg%03d.ts" \
      -master_pl_name master.m3u8 \
      -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
      "$out/v%v.m3u8"
  else
    "$FFMPEG" -y -hide_banner -loglevel error -i "$f" \
      "${vargs[@]}" \
      -f hls -hls_time 4 -hls_playlist_type vod -hls_flags independent_segments \
      -hls_segment_filename "$out/v%v_seg%03d.ts" \
      -master_pl_name master.m3u8 \
      -var_stream_map "v:0 v:1 v:2" \
      "$out/v%v.m3u8"
  fi

  segs=$(find "$out" -name "*.ts" | wc -l)
  total=$(find "$out" -name "*.ts" -exec stat -c%s {} + | awk '{s+=$1} END{printf "%.1f MB", s/1048576}')
  echo "    audio=$has_audio  segments=$segs  total=$total  -> $out/master.m3u8"
  echo
done
echo "Done. Output: $OUT_DIR/"
