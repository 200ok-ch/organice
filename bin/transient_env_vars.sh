#!/bin/bash

# REMOVE due bash error
# shopt -s globstar

RVARS=$(cut -d = -f 1 .env.sample)

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
      sed -i "s/$KEY/$VALUE/" "$DST"/**/*.js
    done
    ;;

  *)
    echo "Unknown command: $1"
    ;;
esac
