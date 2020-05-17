#!/bin/bash

npx pegjs -o src/lib/headline_filter_parser.{js,grammar.pegjs}

# The generated code of pegjs throws eslint warnings. Since it's not
# code that we're writing and we want to keep eslint warnings at 0,
# we're telling eslint to ignore the generated file.
PARSER_FILE=src/lib/headline_filter_parser.js

# Prepend the generated parser code with a `eslint-disable` comment.
# We don't use sed or ex because some Linux/UNIX distros don't support them.
tmp=$(mktemp)
echo '/* eslint-disable */' > "$tmp" && cat "$PARSER_FILE" >> "$tmp" && mv "$tmp" "$PARSER_FILE"
