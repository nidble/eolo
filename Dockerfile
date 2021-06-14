# author: antonino bertulla <abertulla@gmail.com>

# ################
# Builder stage. #
# ################
# It will build: dev-dependencies, rust binary, Ts deps and Js
FROM node:14.15-alpine AS builder

WORKDIR /usr/src/app

# Copy App files
WORKDIR /usr/src/app
COPY --chown=node:node package*.json jest.config.js tsconfig.json ./
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./types ./types
COPY --chown=node:node ./tests ./tests

# Install all dependecies, perform tests and generate Js files
RUN npm install --no-optional --quiet 
RUN npm run test
RUN npm run build

# ################# #
# Production stage. #
# ################# #
# It will take Js and native files from "builder" stage, and also install the production packages only
FROM node:14.15-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --chown=node:node --from=builder /usr/src/app/package*.json ./
# Pick only the bare minimum from native package

# install dependencies and copy Js files
RUN npm ci --quiet --only=production
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

USER node

CMD ["dumb-init", "node", "./dist/server.js"]
