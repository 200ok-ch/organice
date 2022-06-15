FROM debian:buster-slim

RUN apt-get update -y -qq && \
        apt-get install -y -qq \
        apache2-utils \
        apache2

ADD doc/webdav/webdav.conf /etc/apache2/sites-available/webdav.conf

RUN a2enmod headers
RUN a2enmod dav*
RUN a2enmod rewrite
RUN a2ensite webdav


RUN mkdir /srv/dav
# RUN echo demo | htpasswd -ci /srv/dav/.htpasswd demo
RUN chmod 770 /srv/dav
RUN chown www-data. /srv/dav

COPY sample.org /srv/dav/demo.org

CMD apachectl -D FOREGROUND
EXPOSE 80