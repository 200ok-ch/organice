FROM node:12.13-alpine3.9

# Switch to Apline Linux Mirror of Clarkson University:
# https://mirror.clarkson.edu/distributions.html#alpine
# This fixes an issue with hanging fetch commands in CI, see also
# https://github.com/gliderlabs/docker-alpine/issues/307#issuecomment-427465925
RUN sed -i 's/http\:\/\/dl-cdn.alpinelinux.org/http\:\/\/mirror.clarkson.edu/g' /etc/apk/repositories

RUN apk add --no-cache bash yarn

# No root privileges are required. Create and switch to non-root user.
# https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#user
RUN addgroup -S organice \
    && adduser -S organice -G organice

COPY --chown=organice . /opt/organice
WORKDIR /opt/organice

RUN yarn install \
    && yarn global add serve

USER organice

ENV NODE_ENV=production
EXPOSE 5000
ENTRYPOINT ["/bin/bash", "-c", "yarn build && serve -s build"]
