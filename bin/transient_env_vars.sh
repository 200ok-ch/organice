#!/bin/bash

shopt -s globstar

# Use .env if it exists, otherwise fall back to .env.sample
ENV_FILE=".env.sample"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE=".env"
fi
RVARS=$(cut -d = -f 1 $ENV_FILE)

case $1 in

  "bait")
    for KEY in $RVARS; do
      echo "$KEY=${KEY//REACT_APP_/ORGANICE_}"
    done
    ;;

  "switch")
    SRC=$2
    DST=$3

    rm -rf "$DST"
    cp -r "$SRC" "$DST"

    OVARS=${RVARS//REACT_APP_/ORGANICE_}

    for KEY in $OVARS; do
      VALUE=${!KEY}
      echo "Replacing $KEY with $VALUE"
      sed -i "s|$KEY|$VALUE|g" "$DST"/**/*.js
    done
    ;;

  *)
    echo "Unknown command: $1"
    ;;
esac
