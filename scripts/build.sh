#!/bin/sh
# Wraps src/game.html (the page body, also published as-is) into a standalone index.html.
set -e
cd "$(dirname "$0")/.."
{
  cat <<'HEAD'
<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#1b110c">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon.svg">
</head>
<body>
HEAD
  cat src/game.html
  printf '\n</body>\n</html>\n'
} > index.html
echo "built index.html"
