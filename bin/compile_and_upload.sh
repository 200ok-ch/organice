#!/usr/bin/env bash

set -e

# Sanity check that all variables are set to upload to FTP
[ -z ${FTP_HOST+x} ] && (echo "$FTP_HOST needs to be set for uploading to FTP."; exit 1)
[ -z ${FTP_USER+x} ] && (echo "$FTP_USER needs to be set for uploading to FTP."; exit 1)
[ -z ${FTP_PASSWD+x} ] && (echo "$FTP_PASSWD needs to be set for uploading to FTP."; exit 1)

# Configure available back-end API keys
cp .env.sample .env
[ -z ${REACT_APP_DROPBOX_CLIENT_ID+x} ] || sed -i "s/your_dropbox_client_id/${REACT_APP_DROPBOX_CLIENT_ID}/" .env

[ -z ${REACT_APP_GOOGLE_DRIVE_API_KEY+x} ] || sed -i "s/your_google_drive_api_key/${REACT_APP_GOOGLE_DRIVE_API_KEY}/" .env
[ -z ${REACT_APP_GOOGLE_DRIVE_CLIENT_ID+x} ] || sed -i "s/your_google_drive_oauth_client_id/${REACT_APP_GOOGLE_DRIVE_CLIENT_ID}/" .env

[ -z ${REACT_APP_GITLAB_CLIENT_ID+x} ] || sed -i "s/your_gitlab_client_id/${REACT_APP_GITLAB_CLIENT_ID}/" .env
[ -z ${REACT_APP_GITLAB_SECRET+x} ] || sed -i "s/your_gitlab_secret/${REACT_APP_GITLAB_SECRET}/" .env

yarn install
yarn run build
cd build
lftp "$FTP_HOST" <<END_SCRIPT
user $FTP_USER $FTP_PASSWD
mirror -R ./
quit
END_SCRIPT
exit 0
