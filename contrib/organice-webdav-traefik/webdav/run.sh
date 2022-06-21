#!/bin/sh

if [ ! -f /etc/nginx/nginx.conf ]; then

    echo "Configuring WebDAV"

    export DAV_METHODS=${DAV_METHODS:=PUT DELETE MKCOL COPY MOVE}
    PUID=${PUID}
    PGID=${PGID}
    export WEBDAV_PREFIX=${WEBDAV_PREFIX:=/}
    #TZ

    export USER
    export GROUP

    if [ -n "$PGID" ]; then
        echo "Creating group"
        addgroup -g "$PGID" group
        GROUP=group
    fi

    if [ -n "$PUID" ]; then
        echo "Creating user"
        if [ -n "$PGID" ]; then
            adduser --disabled-password --uid "$PUID" --ingroup group user
        else
            adduser --disabled-password --uid "$PUID" user
        fi
        USER=user
    else
        USER=nginx
	GROUP=nginx
    fi

    export LOG_FORMAT='$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent" "$http_x_forwarded_for"'

    chown "$USER":"$GROUP" /var/lib/nginx /var/lib/nginx/tmp
    
    envsubst < /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf

fi

echo "Starting!"

exec nginx -g "daemon off;"
