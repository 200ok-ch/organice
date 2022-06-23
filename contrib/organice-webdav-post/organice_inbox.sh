#!/bin/bash

IFS=$'\n'

DESC=""
DATE=$(date +%Y-%m-%d)
TITLE="$(echo $1 | sed -e 's/"//g' | sed -e "s/'//g")"

for line in $2
do
    if [ "$DESC" == "" ];
    then
        DESC="$(echo $line | sed -e 's/"//g' | sed -e "s/'//g")"
    else
        DESC="$DESC\n    $(echo $line | sed -e 's/"//g' | sed -e "s/'//g")"
    fi
done

echo -e "* TODO $TITLE
  DEADLINE: <$DATE>
  - $DESC" >> $3

echo Added task $1 to $3
