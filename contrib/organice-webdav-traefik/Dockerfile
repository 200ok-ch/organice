FROM alpine

RUN apk add --no-cache nginx-mod-http-dav-ext nginx gettext

VOLUME /data
VOLUME /var/log/nginx
EXPOSE 80
COPY webdav.conf /etc/nginx/nginx.template.conf

COPY run.sh /
RUN chmod +x run.sh && rm /etc/nginx/nginx.conf
CMD /run.sh
