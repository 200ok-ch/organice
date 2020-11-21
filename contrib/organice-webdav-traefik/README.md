# Docker Webdav backend for Organice

This Docker image makes it easy for [Traefik](https://traefik.io) users to set up a Webdav backend for [Organice](https://organice.200ok.ch).
Please note that this is still a WIP. Moreover, my knowledge of network security is very minimal. Use at your own risk.

This repository was forked from https://github.com/gallofeliz/simple-docker-webdav - I have only applied minor modifications to the original version.

## Usage

This is a sample `docker-compose.yml` file which will set up an instance of Organice and a Webdav backend with Traefik.
Please note that this Webdav backend provides neither authentication nor traffic encryption. You _must_ set up a reverse proxy (such as Traefik) in front of it in order to make it secure.

The following example sets up HTTP Basic Auth (via Traefik) in front of the Webdav container. Other options - such as IP whitelisting - are available.
Consult the Traefik documentation for more details.
It also sets up Let's Encrypt certificates automatically.

```yaml
version: "3.7"

services:
  traefik:
    container_name: traefik
    image: "traefik:latest"
    command:
      - --entrypoints.websecure.address=:443
      - --entrypoints.web.address=:80
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https
      - --providers.docker
      - --certificatesresolvers.le.acme.email=${EMAIL}
      - --certificatesresolvers.le.acme.storage=/acme.json
      - --certificatesresolvers.le.acme.tlschallenge=true
      - --api
      - --log.filePath=/var/log/error.log
      - --log.level=INFO
      - --accesslog.filepath=/var/log/access.log
      - --accesslog=true
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./traefik/acme.json:/acme.json"
      - "./traefik/log:/var/log"
    labels:
      - "traefik.http.routers.traefik.tls.certresolver=le"
      - "traefik.http.routers.traefik.entrypoints=websecure"
      - "traefik.http.middlewares.auth.basicauth.users=${HTTP_AUTH}"
    restart: unless-stopped

  organice:
    image: "twohundredok/organice:latest"
    container_name: organice
    restart: unless-stopped
    labels:
      - traefik.http.routers.organice.rule=Host(`${DOMAIN}`)
      - traefik.http.routers.organice.middlewares=auth
      - traefik.http.routers.organice.tls.certresolver=le
      - traefik.http.routers.organice.entrypoints=websecure
      - traefik.http.services.organice.loadbalancer.server.port=5000

  webdav:
    image: edgarvincent/webdav
    container_name: webdav
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - WEBDAV_PREFIX=${WEBDAV_PREFIX}
    volumes:
      - ${ORG_DIR}:/data
      - ./webdav/log:/var/log/nginx
    restart: unless-stopped
    labels:
      - traefik.http.routers.webdav.rule=Host(`${DOMAIN}`) && PathPrefix(`/${WEBDAV_PREFIX}`)
      - traefik.http.routers.webdav.tls.certresolver=le
      - traefik.http.routers.webdav.entrypoints=websecure
      - traefik.http.services.webdav.loadbalancer.server.port=80
      - traefik.http.routers.webdav.middlewares=auth
```

## Environment variables

Replace the following variables in the example above with the desired values, as described below. You can also define them in your `.env` file (with, for example, `PUID=1000`).

| Container | Variable          | Description                                                                                     | Example value                                                    |
| :-------: | :---------------: | :--------------------------------------------------------------------------------:              | :--------------------------------------------------------------: |
| Both      | \${HTTP_AUTH}     | User/password pair for Basic Auth <sup>1</sup>                                                  | Foobar:$$2y$$05\$\$s6HgvuWptDeM9I...                             |
| Both      | \${DOMAIN}        | Domain name used to access Organice                                                             | organice.example.com                                   |
| webdav    | \${PUID}          | UID of the user your Org files belong to                                                        | 1000                                                             |
| webdav    | \${PGID}          | GID of the group your Org files belong to                                                       | 1000                                                             |
| Both      | \${WEBDAV_PREFIX} | Subpath of ${DOMAIN} the Webdav server will be providing your Org files from, without slashes. | webdav                                                           |
| webdav    | \${ORG_DIR}       | Directory which contains your Org files                                                         | /home/foobar/Org                                                 |
| Traefik   | \${EMAIL}         | Email for Let's Encrypt registration                                                            | foobar@example.com                                               |
| webdav    | \${DAV_METHODS}   | List of Dav methods, as they would be listed in `nginx.conf`, separated by spaces.              | Set to `off` for read-only. If not set, all methods are enabled. |

<sup>1</sup> See [this article](https://medium.com/@techupbusiness/add-basic-authentication-in-docker-compose-files-with-traefik-34c781234970) for details on how to generate it.
