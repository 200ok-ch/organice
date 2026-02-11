#!/bin/bash
set -e

echo "==> Copying build to serve directory"
rm -rf serve
cp -r build serve

echo "==> Replacing environment variables in JS files"
VARS="ORGANICE_DROPBOX_CLIENT_ID ORGANICE_GITLAB_CLIENT_ID ORGANICE_GITLAB_SECRET ORGANICE_WEBDAV_URL"

for KEY in $VARS; do
  VALUE="${!KEY}"
  if [ -n "$VALUE" ]; then
    echo "Replacing $KEY"
    find serve -name "*.js" -type f | while read -r file; do
      awk -v key="$KEY" -v val="$VALUE" '{gsub(key, val)} 1' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    done
  else
    echo "Warning: $KEY not set, skipping"
  fi
done

echo "==> Starting server on port 5000"
serve -p 5000 -s serve
