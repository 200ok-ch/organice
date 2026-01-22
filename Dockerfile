# Multi-stage Dockerfile for organice
# Supports both development and production builds

FROM node:20.17.0-bookworm AS base

WORKDIR /opt/organice

# Copy package files
COPY package.json yarn.lock /opt/organice/

# Development stage
FROM base AS development

# Copy source code
COPY . /opt/organice

# Generate environment variables
RUN bin/transient_env_vars.sh bait > .env

# Create non-root user
RUN groupadd organice \
        && useradd -g organice organice \
        && chown -R organice: /opt/organice

USER organice

# Install dependencies
RUN yarn install

ENV NODE_ENV=development
EXPOSE 3000
CMD ["/bin/bash"]

# Build stage
FROM base AS build

# Copy source code
COPY . /opt/organice

# Install dependencies, including devDependencies like Parcel
RUN yarn install --frozen-lockfile

# Generate environment variables
RUN bin/transient_env_vars.sh bait > .env

# Build the application
RUN yarn build

# Production stage
FROM node:20.17.0-bookworm-slim AS production

RUN npm install -g serve

WORKDIR /opt/organice

# Copy built application and necessary files from build stage
COPY --from=build /opt/organice/dist ./build/
COPY --from=build /opt/organice/bin ./bin/
COPY --from=build /opt/organice/package.json .
COPY --from=build /opt/organice/.env .

# Create non-root user
RUN groupadd organice \
        && useradd -g organice organice \
        && chown -R organice: /opt/organice

USER organice

ENV NODE_ENV=production
EXPOSE 5000
ENTRYPOINT ["./bin/entrypoint.sh"]
