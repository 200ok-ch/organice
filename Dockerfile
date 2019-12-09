FROM node:12.13-alpine3.9

RUN apk add --no-cache yarn

COPY . /opt/organice
WORKDIR /opt/organice

RUN yarn install \
    && yarn global add serve \
    && yarn build

RUN addgroup -S organice \
    && adduser -S organice -G organice
USER organic

ENV NODE_ENV=production
EXPOSE 5000
ENTRYPOINT ["serve", "-s", "build"]
