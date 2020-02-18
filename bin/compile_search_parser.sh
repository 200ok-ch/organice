#!/bin/bash

npx pegjs -o src/lib/headline_filter_parser.{js,grammar.pegjs}

# The generated code of pegjs throws eslint warnings. Since it's not
# code that we're writing and we want to keep eslint warnings at 0,
# we're telling eslint to ignore the generated file.
PARSER_FILE=src/lib/headline_filter_parser.js

# Prepend the generated parser code with a `eslint-disable` comment.
sed -i '1i \/* eslint-disable */' "$PARSER_FILE"

