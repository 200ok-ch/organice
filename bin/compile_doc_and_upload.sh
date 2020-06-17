#!/bin/bash

here=$(dirname $0)

if $here/compile_doc.sh; then
    lftp -e "put documentation.html; exit" -u $FTP_USER,$FTP_PASSWD $FTP_HOST
else
    echo >&2 "compile_doc.sh failed; skipping upload"
    exit 1
fi
