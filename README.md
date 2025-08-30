# Hono Static Adapter for Fastly Compute

by Katsuyuki Omuro

`@h7/hono-fastly-static` is an Adapter for [Hono](https://hono.dev) to allow your program to serve static files under [Fastly Compute](https://www.fastly.com/products/edge-compute). It leverages the `PublisherServer` from [`@fastly/compute-js-static-publish`](https://www.npmjs.com/package/@fastly/compute-js-static-publish).

Works with:
* Hono v4.x
* compute-js-static-publish v6.x and v7.x

## Example

### compute-js-static-publish v7

```typescript
import { Hono } from 'hono/quick'
import { fire } from 'hono/service-worker'

import { serveStatic } from '@h7/hono-fastly-static'
import { PublisherServer } from '@fastly/compute-js-static-publish'
import rc from '../static-publish.rc.js'
const staticPublisherServer = PublisherServer.fromStaticPublishRc(rc)

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/favicon.ico', serveStatic({ path: './favicon.ico', staticPublisherServer }))
app.get('/static/*', serveStatic({ root: './', staticPublisherServer }))

fire(app)
```

### compute-js-static-publish v6

```typescript
import { Hono } from 'hono/quick'
import { fire } from 'hono/service-worker'

import { serveStatic } from '@h7/hono-fastly-static'
import { getServer } from '../static-publisher/statics.js'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
});

const staticPublisherServer = getServer()
app.get('/favicon.ico', serveStatic({ path: './favicon.ico', staticPublisherServer }))
app.get('/static/*', serveStatic({ root: './', staticPublisherServer }))

fire(app)
```

## Usage

> [!NOTE]
> The instructions below are for @fastly/compute-js-static-publish v7.

Once you have [set up a Hono project for Fastly Compute](https://hono.dev/getting-started/fastly), add this Adapter, the Fastly CLI, and the Static Publisher library to your application:

```
npm install @h7/hono-fastly-static @fastly/cli @fastly/compute-js-static-publish
```

These directions assume your static files exist directly under the `./assets` subdirectory of your Fastly Compute application.

You will need to add and modify some files at the root of your project.

* Add `static-publish.rc.js`
    ```javascript
    /** @type {import('@fastly/compute-js-static-publish').StaticPublishRc} */
    const rc = {
        kvStoreName: "site-content",
        publishId: "default",
        defaultCollectionName: "live",
        staticPublisherWorkingDir: "./static-publisher",
    };
    
    export default rc;
    ```
    This sets up the Static Publisher to use a KV Store named `site-content` and to place generated temporary files in the `./static-publisher` subdirectory. The other fields are not used in `@h7/hono-fastly-static` but are required fields.

    > [!TIP]
    > Add `./static-publisher/` to your `.gitignore` as these files will be regenerated on the build.

* Add `publish-content.config.js`
    ```javascript
    /** @type {import('@fastly/compute-js-static-publish').PublishContentConfig} */
    const config = {
        rootDir: './assets'
    };
    
    export default config;
    ```

    This instructs the Static Publisher to find static files at `./assets`.

    > [!IMPORTANT]
    > As this application does not use `PublisherServer` to directly serve assets, the `server` field is not applicable.

* Modify `package.json`
    Add the following items under the `scripts` section:
    ```json
    {
      "scripts": {
        "dev:publish": "npx @fastly/compute-js-static-publish publish-content --local",
        "dev:start": "fastly compute serve",
        "fastly:deploy": "fastly compute publish",
        "fastly:publish": "npx @fastly/compute-js-static-publish publish-content"
      }
    }
    ```

* Modify `fastly.toml`
    Add the following lines to the end of the file:
    ```toml
    [local_server.kv_stores]
    site-content = { file = "./static-publisher/kvstore.json", format = "json" }

    [setup.kv_stores.site-content]
    ``` 

Finally, modify your application's `src/index.ts` file:
1. Import `serveStatic` from this library and `PublisherServer` from `@fastly/compute-js-static-publish`
2. Import the default constant from `static-publish.rc.js` and pass it to `PublisherServer.fromStaticPublishRc()` to obtain an instance of the Publisher Server.
3. Call `serveStatic` to instantiate [Hono Middleware](https://hono.dev/guides/middleware), passing in the `PublisherServer` instance obtained above. 

```typescript
import { Hono } from 'hono/quick'
import { fire } from 'hono/service-worker'

import { serveStatic } from '@h7/hono-fastly-static'
import { PublisherServer } from '@fastly/compute-js-static-publish'
import rc from '../static-publish.rc.js'
const staticPublisherServer = PublisherServer.fromStaticPublishRc(rc)

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/favicon.ico', serveStatic({ path: './favicon.ico', staticPublisherServer }))
app.get('/static/*', serveStatic({ root: './', staticPublisherServer }))

fire(app)
```

Include either `path` or `root` in the object passed to `serveStatic()`.
* `path` - serves the static file at the specified path under the asset directory.
    * e.g., a request for `/favicon.ico` serves `./assets/favicon.ico`.
* `root` - serves the file at the path under the asset directory relative to the specified directory.
    * e.g., a request for `/static/foo.html` serves `./assets/static/foo.html`.

### Run locally

```sh
npm run dev:publish          # 'publish' your files to the simulated local KV Store
npm run dev:start            # preview locally
```

Serves your app at `http://127.0.0.1:7676`, powered by a simulated KV Store.

### Deploy to Fastly Compute

[Create a free Fastly account](https://www.fastly.com/signup/?tier=free) if you haven't already, and then:

```sh
npm run fastly:deploy        # deploy the app
npm run fastly:publish       # upload your static files
```

Further changes involving only updates to your static files can be made by running:
```sh
npm run fastly:publish       # upload your static files
```

📘 For more on Compute-JS Static Publisher:  
[https://github.com/fastly/compute-js-static-publish](https://github.com/fastly/compute-js-static-publish)

## License

[MIT](./LICENSE).
