import { createMiddleware } from 'hono/factory';
import { PublisherServer, type StaticPublishRc, type PublishContentConfig } from '@fastly/compute-js-static-publish';

export type ServeStaticMiddlewareOptions = {
  path?: string,
  root?: string,
};

export type ServeStaticOptions = ServeStaticMiddlewareOptions & {
  staticPublisherServer: PublisherServer,
};

export function serveStatic(options: ServeStaticOptions) {

  const server = options.staticPublisherServer;
  let root = options.root ?? './';
  if (!root.endsWith('/')) {
    root += root;
  }
  const base = new URL(root, 'https://www.example.com/');

  return createMiddleware(async (c, next) => {

    let reqPath = options.path ?? c.req.path;
    if (reqPath.startsWith('/')) {
      reqPath = '.' + reqPath;
    }

    const pathname = new URL(reqPath, base).pathname;

    const asset = await server.getMatchingAsset(pathname);
    if (asset == null) {
      await next();
      return;
    }

    c.res = undefined;
    c.res = await server.serveAsset(c.req.raw, asset, { cache: 'never' });

  });
}

export function fromPublisherServer(server: PublisherServer) {
  return (options: ServeStaticMiddlewareOptions) =>
    serveStatic({ ...options, staticPublisherServer: server });
}

export function fromStaticPublishRc(rc: StaticPublishRc) {
  return fromPublisherServer(PublisherServer.fromStaticPublishRc(rc));
}

export { PublisherServer, type StaticPublishRc, type PublishContentConfig };
