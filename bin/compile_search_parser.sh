#!/bin/bash

npx pegjs -o src/lib/headline_filter_parser.{js,grammar.pegjs}

# The generated code of pegjs throws eslint warnings. Since it's not
# code that we're writing and we want to keep eslint warnings at 0,
# we're telling eslint to ignore the generated file.
PARSER_FILE=src/lib/headline_filter_parser.js
TMP_FILE=/tmp/headline_filter_parser.js

# Prepend the generated parser code with a `eslint-disable` comment.
echo '/* eslint-disable */' > "$TMP_FILE"
cat "$PARSER_FILE" >> "$TMP_FILE"
mv "$TMP_FILE" "$PARSER_FILE"

