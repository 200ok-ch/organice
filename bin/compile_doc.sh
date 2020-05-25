#!/bin/bash

if ! [ -e README.org ]; then
    echo >&2 "Error: Please run this script from top of the organice repository."
    exit 1
fi

echo "#+SETUPFILE: https://fniessen.github.io/org-html-themes/setup/theme-readtheorg.setup" > documentation.org
cat README.org | grep -v api.codeclimate | grep -v "https://organice.200ok.ch/documentation.html" >> documentation.org
sed -i 's/# REPO_PLACEHOLDER/Code repository: https:\/\/github.com\/200ok-ch\/organice/' documentation.org
cat WIKI.org >> documentation.org
cat CONTRIBUTING.org >> documentation.org
pandoc CODE_OF_CONDUCT.md -o CODE_OF_CONDUCT.org
cat CODE_OF_CONDUCT.org >> documentation.org
rm CODE_OF_CONDUCT.org
emacs documentation.org -l ./doc/org2html/init.el --batch  --funcall org-html-export-to-html
