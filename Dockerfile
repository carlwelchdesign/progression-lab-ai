FROM node:22-alpine3.21
WORKDIR /app

# Keep base OS packages current to reduce known CVEs.
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

ENV YARN_CACHE_FOLDER=/tmp/.yarn-cache

COPY --chown=node:node package.json yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean

COPY --chown=node:node . .

ENV NODE_ENV=development

# Run as the non-root node user provided by the base image.
USER node

EXPOSE 3000

CMD ["yarn", "dev"]