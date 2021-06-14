# Eolo

Eolo is a RESTful app capable to perform image manipulation embracing twelve factors and cutting edge performances

- Full stricted Typescript code
- Fine granular configuration of Eslint, Prettier and Tsc

## Tech

Eolo uses a number of open source projects to work properly:

- [PolkaJS] - A micro web server so fast, it'll make you dance! 👯
- [Nanoid] - A tiny, secure, URL-friendly, unique string ID generator for JavaScript.
- [Node.js] - evented I/O for the backend
- [Pino] - 🌲 super fast, all natural json logger 🌲

And of course Eolo Captcha itself is open source with a [public repository][eolo]
 on GitHub.

## Installation

Eolo requires [Node.js](https://nodejs.org/) v12+ to run.

Install the Nodejs runtime and Rust language following respective documentations.

```sh
npm i
LOG_LEVEL=info node run start
```

```sh
npm install --production
NODE_ENV=production node app
```

## ENVriomental variables

What follows is a table of principal variables and some examples

| Env Name | Example |
| ------ | ------ |
| NODE_ENV | `production` |
| LOG_LEVEL | `info`, `warn`, `error` or `debug`, default `silent` |
| PORT | default `3000` |


## Testing

Once dependencies were installed, execute

```sh
npm run test

```

For coverage:

```sh
npm run test:coverage

```

## License

**MIT**

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

   [eolo]: <https://github.com/nidble/eolo>
   [PolkaJs]: <https://github.com/lukeed/polka>
   [Nanoid]: <https://www.npmjs.com/package/nanoid>
   [node.js]: <http://nodejs.org>
   [Pino]: <https://github.com/pinojs/pino/issues>
