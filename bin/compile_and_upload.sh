#!/bin/sh

# TODO: Check for existence of $HOST, $USER, $PASSWD

set -e

cp .env.sample .env
yarn install
yarn run build
cd build
lftp "$FTP_HOST" <<END_SCRIPT
user $FTP_USER $FTP_PASSWD
mirror -R ./
quit
END_SCRIPT
exit 0
