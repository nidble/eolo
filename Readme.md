# Eolo
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/33b2fa9196944d38a9fcbc74455895aa)](https://www.codacy.com/gh/nidble/eolo/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=nidble/eolo&amp;utm_campaign=Badge_Grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/33b2fa9196944d38a9fcbc74455895aa)](https://www.codacy.com/gh/nidble/eolo/dashboard?utm_source=github.com&utm_medium=referral&utm_content=nidble/eolo&utm_campaign=Badge_Coverage)

Eolo is a RESTful app that can accept and manipulate images uploaded by the user. The manipulation is deferred thanks to a queue. Lastly, a feed provides a list of all images available for every user. Eolo embraces twelve factors, cutting-edge performances, and functional programming.

- With ESM module support and `experimental-specifier-resolution=node`
- Full stricted Typescript code
- Fine granular configuration of Eslint, Prettier and Tsc
- Domain Driven Development throught _Decoder_ and _Parsers_

## Tech

Eolo uses a number of open source projects to work properly:

- [PolkaJS] - A micro web server so fast, it'll make you dance! 👯
- [FP-TS] - Functional programming in TypeScript 
- [IO-TS] - Runtime type system for IO decoding/encoding 
- [Sharp] - High performance Node.js image processing, the fastest module to resize JPEG, PNG, WebP, AVIF and TIFF images. 
- [Node.js] - evented I/O for the backend
- [Redis] - Redis is an open source (BSD licensed), in-memory data structure store, used as a database, cache, and message broker.
- [Pino] - 🌲 super fast, all natural json logger 🌲

And of course Eolo is itself open source with a [public repository][eolo] on GitHub.

## Installation

Eolo requires [Node.js](https://nodejs.org/) v16+ and [Redis] v6.2+ to run. 

Install the Nodejs runtime and Redis following respective documentations. Then...

provide a custom `.env` file, ie:
```sh
cp .env.example .env
```

bootstrap Server with:
```sh
yarn install
LOG_LEVEL=info yarn start

## for production: 
yarn install --production
LOG_LEVEL=info NODE_ENV=production yarn start

```

and start the Worker:
```sh
LOG_LEVEL=info yarn worker

## for production: 
LOG_LEVEL=info  NODE_ENV=production yarn worker
```

In case of errors ie: `ECONNREFUSED`, etc. Please consider to properly tweak the following Env's variables.

## Enviromental variables

What follows is a table of principal variables and some examples

| Env Name | Example |
| ------ | ------ |
| NODE_ENV | `production` |
| LOG_LEVEL | `info`, `warn`, `error` or `debug`, default `silent` |
| PORT | default `3000` |
| REDIS_PREFIX | prefix |
| REDIS_PORT | 6379 |
| REDIS_HOST | 127.0.0.1 |
| REDIS_FAMILY | 4 | 
| REDIS_PASSWORD | "CHANGEME"| 
| REDIS_DB | 0 |
| UPLOADS_FOLDER | "uploads/" |

## Testing

Once dependencies were installed, execute

```sh
yarn test

```

for coverage:

```sh
yarn test:coverage

```

## Docker

Eolo can be executed from a container without any further ado. 
Please take care to properly provide a working `.env` file (for an exaustive list please consider: [Env Variables](https://github.com/nidble/eolo#envriomental-variables) ) and then issue:

```sh
docker-compose up
```
Eventualy adjust write permissions of upload folder.

## Curl Examples
verify that server working is awake with the following command
```sh
curl -H "Content-Type: application/json" -X GET http://localhost:3030/healthz
```

then submit a new image
```sh
curl -F username=pluto -F image=@/home/Users/pluto/32178.jpg http://localhost:3030/api/v1/image
```

or see all user's images
```sh
curl -X GET http://localhost:3030/api/v1/image/pluto/
```

## FE Example
An Html page with a POC is available on `example` folder, to play with it issue:
```sh
cd example
npx static-server
```

## License

[**MIT**](https://github.com/nidble/eolo/blob/master/LICENSE)

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

   [eolo]: <https://github.com/nidble/eolo>
   [PolkaJs]: <https://github.com/lukeed/polka>
   [Sharp]: <https://www.npmjs.com/package/sharp>
   [Redis]: <https://redis.io/download>
   [node.js]: <http://nodejs.org>
   [Pino]: <https://github.com/pinojs/pino>
   [FP-TS]: <https://github.com/gcanti/fp-ts>
   [IO-TS]: <https://github.com/gcanti/io-ts>
