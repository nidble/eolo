# author: antonino bertulla <abertulla@gmail.com>

# ################
# Builder stage. #
# ################

# It will build: dev-dependencies, rust binary, Ts deps and Js
FROM node:16.3-alpine AS builder

WORKDIR /usr/src/app

# Copy conf files
COPY --chown=node:node package*.json jest.config.cjs tsconfig.json ./

# Install all dependecies, perform tests and generate Js files
RUN npm install --no-optional --quiet

# Copy app files
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./types ./types
COPY --chown=node:node ./tests ./tests

# Test 'n' Build
RUN npm run test
RUN npm run build

# ################# #
# Production stage. #
# ################# #

# It will take Js and native files from "builder" stage, and also install the production packages only
FROM node:16.3-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app
ENV NODE_ENV=production

COPY --chown=node:node --from=builder /usr/src/app/package*.json ./
# Pick only the bare minimum from native package

# install dependencies and copy Js files
RUN npm ci --quiet --only=production
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

EXPOSE 3030

USER node

CMD ["dumb-init", "node", "./dist/server.js"]
