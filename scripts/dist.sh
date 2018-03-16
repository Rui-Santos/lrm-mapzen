#!/bin/bash

VERSION=`echo "console.log(require('./package.json').version)" | node`

echo Building dist files for $VERSION...
mkdir -p dist
browserify -t browserify-shim src/*.js > dist/lrm-valhalla.js
browserify -t uglifyify -t browserify-shim src/*.js | uglifyjs -c > dist/lrm-valhalla.min.js

node-sass --output-style compressed -o dist/ src/styles/lrm-valhalla.scss

cp src/styles/lrm-valhalla-icons.svg dist/lrm-valhalla-icons.svg
cp src/styles/lrm-valhalla-modes.svg dist/lrm-valhalla-modes.svg
cp src/styles/lrm-valhalla-icons.png dist/lrm-valhalla-icons.png
cp src/styles/routing-icon.png dist/routing-icon.png

echo Done.
