#!/bin/bash

# Sanity check that all variables are set to upload to FTP
[ -z ${FTP_HOST+x} ] && (echo "$FTP_HOST needs to be set for uploading to FTP."; exit 1)
[ -z ${FTP_USER+x} ] && (echo "$FTP_USER needs to be set for uploading to FTP."; exit 1)
[ -z ${FTP_PASSWD+x} ] && (echo "$FTP_PASSWD needs to be set for uploading to FTP."; exit 1)


here=$(dirname $0)

if $here/compile_doc.sh; then
    lftp -e "put documentation.html; exit" -u $FTP_USER,$FTP_PASSWD $FTP_HOST
else
    echo >&2 "compile_doc.sh failed; skipping upload"
    exit 1
fi
