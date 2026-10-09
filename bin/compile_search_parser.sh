#!/usr/bin/env bash

npx peggy -o src/lib/headline_filter_parser.{js,grammar.pegjs}

# The generated code of peggy throws eslint warnings. Since it's not
# code that we're writing and we want to keep eslint warnings at 0,
# we're telling eslint to ignore the generated file.
PARSER_FILE=src/lib/headline_filter_parser.js

# Prepend the generated parser code with a `eslint-disable` comment.
# We don't use `sed` or `ex` because some Linux/UNIX distros don't
# support them. For example MacOS ships with BSD sed which doesn't
# support `-i` and some barebones Linux distros don't ship `ex`.
# `mktemp` works under Linux and MacOS, though.
tmp=$(mktemp)
echo '/* eslint-disable */' > "$tmp" && cat "$PARSER_FILE" >> "$tmp" && mv "$tmp" "$PARSER_FILE"
