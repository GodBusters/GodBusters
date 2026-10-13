#!/bin/sh
# Assembles src/ into:
#   dist/game.html — the page body (published as the artifact)
#   index.html     — a standalone page for GitHub Pages / home-screen install
set -e
cd "$(dirname "$0")/.."
mkdir -p dist
{
  cat src/head.html
  printf '<style>\n'; cat src/style.css; printf '</style>\n'
  cat src/body.html
  printf '<script>\n(() => {\n"use strict";\n'
  for f in src/js/*.js; do cat "$f"; printf '\n'; done
  printf '})();\n</script>\n'
} > dist/game.html
{
  cat <<'HEAD'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#0b0e22">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon.svg">
</head>
<body>
HEAD
  cat dist/game.html
  printf '</body>\n</html>\n'
} > index.html
echo "built dist/game.html and index.html ($(wc -c < dist/game.html) bytes)"
