FROM debian:buster-slim

ARG USER_ID=1000
ARG GROUP_ID=1000

RUN userdel -f www-data &&\
    if getent group www-data ; then groupdel www-data; fi &&\
    groupadd -g ${GROUP_ID} www-data &&\
    useradd -l -u ${USER_ID} -g www-data www-data &&\
    install -d -m 0755 -o www-data -g www-data /home/www-data

RUN apt-get update -y -qq && \
        apt-get install -y -qq \
        apache2-utils \
        apache2

RUN ls -ld /var/cache/apache2/mod_cache_disk
RUN chown www-data. /var/cache/apache2/mod_cache_disk
RUN ls -ld /var/cache/apache2/mod_cache_disk

ADD doc/webdav/webdav.conf /etc/apache2/sites-available/webdav.conf

RUN a2enmod headers
RUN a2enmod dav*
RUN a2enmod rewrite
RUN a2ensite webdav


RUN mkdir /srv/dav
# RUN echo demo | htpasswd -ci /srv/dav/.htpasswd demo
RUN chmod 770 /srv/dav
RUN chown www-data. /srv/dav

COPY sample.org /srv/dav

CMD apachectl -D FOREGROUND
EXPOSE 80
