#!/bin/sh
# Empaqueta la app en un solo archivo y le pone una versión nueva, para que
# los móviles carguen siempre la última versión y no una guardada en caché.
set -e
cd "$(dirname "$0")"
V=$(date +%Y%m%d%H%M)
npx --yes esbuild js/app.js --bundle --format=esm --target=es2022 --outfile=js/app.bundle.js
sed -i -E "s#js/app\.bundle\.js\?v=[0-9]+#js/app.bundle.js?v=$V#; s#css/styles\.css\?v=[0-9]+#css/styles.css?v=$V#" index.html
echo "Versión $V lista"
