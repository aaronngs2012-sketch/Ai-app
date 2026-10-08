#!/bin/sh
# Gives the CSS and JS links a new ?v= number so browsers and GitHub Pages
# fetch the new files straight away instead of an old saved copy.
# Run this before committing any change to css/ or js/.
cd "$(dirname "$0")" || exit 1
V=$(date -u +%Y%m%d%H%M)
sed -i.bak -E \
  -e "s#href=\"css/styles.css(\?v=[0-9]+)?\"#href=\"css/styles.css?v=$V\"#" \
  -e "s#src=\"js/products.js(\?v=[0-9]+)?\"#src=\"js/products.js?v=$V\"#" \
  -e "s#src=\"js/app.js(\?v=[0-9]+)?\"#src=\"js/app.js?v=$V\"#" \
  index.html && rm -f index.html.bak
echo "Version set to $V"
