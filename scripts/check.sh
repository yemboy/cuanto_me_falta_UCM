#!/usr/bin/env bash
# Verificación estándar del proyecto (la misma que corre el CI):
# 1. Sintaxis de todos los JS
# 2. Violaciones de CSP en código generado (nada de onclick= ni style="" inline)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "— Sintaxis JS —"
for f in app.js utils.js progress-codec.js three-scene.js countdown.js \
         data.js releases.js owner_progress.js equivalences.js sw.js; do
  bun build --no-bundle "$f" > /dev/null
  echo "OK $f"
done

echo "— CSP: sin onclick inline —"
if grep -n "onclick=" app.js utils.js progress-codec.js three-scene.js countdown.js index.html; then
  echo "FALLO CSP: onclick inline encontrado"; exit 1
fi
echo "OK onclick"

echo "— CSP: sin style=\"\" generado en JS —"
if grep -n 'style="' app.js utils.js progress-codec.js countdown.js; then
  echo "FALLO CSP: style inline generado en JS"; exit 1
fi
echo "OK style"
