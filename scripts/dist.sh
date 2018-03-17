#!/bin/bash

VERSION=`echo "console.log(require('./package.json').version)" | node`

echo Building dist files for $VERSION...
mkdir -p dist
browserify -t browserify-shim src/*.js > dist/tpp-lrm-valhalla.js
browserify -t uglifyify -t browserify-shim src/*.js | uglifyjs -c > dist/tpp-lrm-valhalla.min.js

node-sass --output-style compressed -o dist/ src/styles/tpp-lrm-valhalla.scss

cp src/styles/tpp-lrm-valhalla-icons.svg dist/tpp-lrm-valhalla-icons.svg
cp src/styles/tpp-lrm-valhalla-modes.svg dist/tpp-lrm-valhalla-modes.svg
cp src/styles/tpp-lrm-valhalla-icons.png dist/tpp-lrm-valhalla-icons.png
cp src/styles/routing-icon.png dist/routing-icon.png

echo Done.
