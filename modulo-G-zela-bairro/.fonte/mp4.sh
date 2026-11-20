#!/bin/bash
# Converte os .webm gravados por videos.js em MP4 (um por animação) e junta tudo em Design.mp4.
# Uso: bash mp4.sh <pasta_webm> <pasta_design>
W=$1; D=$2; mkdir -p $D/videos; cd $W; rm -f lista.txt
for f in *.webm; do n=${f%.webm}
  ffmpeg -loglevel error -y -i $f -c:v libx264 -pix_fmt yuv420p -crf 26 -preset veryfast -movflags +faststart $D/videos/$n.mp4
  ffmpeg -loglevel error -y -i $f -vf "scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2:color=0x1f2933,fps=25" -c:v libx264 -pix_fmt yuv420p -crf 28 -preset veryfast n-$n.mp4
  echo "file 'n-$n.mp4'" >> lista.txt
done
ffmpeg -loglevel error -y -f concat -safe 0 -i lista.txt -c copy -movflags +faststart $D/Design.mp4
