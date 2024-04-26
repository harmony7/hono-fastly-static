# Hono Static Adapter for Fastly Compute

by Katsuyuki Omuro

`@h7/hono-fastly-static` is an Adapter for [Hono](https://hono.dev) to allow your program to serve static files under
[Fastly Compute](https://www.fastly.com/products/edge-compute). It leverages the `PublisherServer` from
[`@fastly/compute-js-static-publish`](https://www.npmjs.com/package/@fastly/compute-js-static-publish).

## Example

```typescript
import { Hono } from 'hono/quick'
import { serveStatic } from '@h7/hono-fastly-static';
import { getServer } from '../static-publisher/statics.js';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

const staticPublisherServer = getServer();
app.get('/favicon.ico', serveStatic({ path: './favicon.ico', staticPublisherServer }));
app.get('/static/*', serveStatic({ root: './', staticPublisherServer }));

app.fire();
```

## Usage

Once you have [set up a Hono project for Fastly Compute](https://hono.dev/getting-started/fastly),
add this Adapter and the Static Publisher library to your application:

```
npm install @h7/hono-fastly-static @fastly/compute-js-static-publish
```

Then, add a `static-publish.rc.js` file to the root of your application:
```
/** @type {import('@fastly/compute-js-static-publish').StaticPublisherConfig} */
module.exports = {
  rootDir: './assets',
  staticContentRootDir: './static-publisher',
  excludeDirs: [],
};
```

This sets up the Static Publisher so that it processes the files under `./assets` and makes them available
to your Compute program at `./static-publisher/statics.js`.

Modify the `"prebuild"` script under `package.json` to run `compute-js-static-publisher`:

```json
{
  "scripts": {
    "prebuild": "compute-js-static-publish --build-static --suppress-framework-warnings && node ./build.js"
  }
}
```

> TIP: Add `./static-publisher/` to your `.gitignore` as these files will be regenerated on the build.

Finally, modify your application's `index.ts` file:
1. Import `serveStatic` from this library
2. Import `getServer` from `../static-publisher/statics.js` to instantiate a `PublisherServer` instance
3. Call `serveStatic`, passing it the `PublisherServer` instance, and use the return value as a
    [Hono Middleware](https://hono.dev/guides/middleware). 

```typescript
import { Hono } from 'hono/quick'
import { serveStatic } from '@h7/hono-fastly-static';
import { getServer } from '../static-publisher/statics.js';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

const staticPublisherServer = getServer();
app.get('/favicon.ico', serveStatic({ path: './favicon.ico', staticPublisherServer }));
app.get('/static/*', serveStatic({ root: './', staticPublisherServer }));

app.fire();
```

Run your application locally with `npm run dev`.

Now, requesting a path such as `http://localhost:7676/static/foo.html` will serve the static file at
`./assets/static/foo.html`. 

## License

[MIT](./LICENSE).
