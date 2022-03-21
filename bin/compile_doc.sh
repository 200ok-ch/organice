#!/usr/bin/env bash

if ! [ -e README.org ]; then
    echo >&2 "Error: Please run this script from top of the organice repository."
    exit 1
fi

if ! which pandoc >/dev/null 2>&1; then
    echo >&2 "Error: You need pandoc installed to build the docs."
    exit 1
fi

# The SETUPFILE is a verbatim copy of:
# https://raw.githubusercontent.com/fniessen/org-html-themes/master/org/theme-readtheorg.setup
# It normally wouldn't be necessary to download it into this
# repository, however, CircleCI at some point refused to download the
# file for months. Therefore, now it's included in the repository.
echo "#+SETUPFILE: doc/setupfile" > documentation.org

# Replace absolute links with anchors with only the anchor part (#787).
cat README.org | \
    grep -v api.codeclimate | \
    grep -v "^Documentation: https://organice.200ok.ch/documentation.html" \
    sed 's/https:\/\/organice.200ok.ch\/documentation.html#/#/g' \
    >> documentation.org

sed -i 's/# REPO_PLACEHOLDER/Code repository: https:\/\/github.com\/200ok-ch\/organice/' documentation.org
cat WIKI.org >> documentation.org
cat CONTRIBUTING.org >> documentation.org
pandoc CODE_OF_CONDUCT.md -o CODE_OF_CONDUCT.org
cat CODE_OF_CONDUCT.org >> documentation.org
rm CODE_OF_CONDUCT.org
emacs documentation.org -l ./doc/org2html/init.el --batch  --funcall org-html-export-to-html --kill

html="`pwd`/documentation.html"
if [ -e "$html" ]; then
    echo "Documentation written to file://$html"
else
    echo >&2 "Error: failed to build documentation"
    exit 1
fi
