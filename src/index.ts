import { createMiddleware } from 'hono/factory';
import { type PublisherServer } from '@fastly/compute-js-static-publish';

export type ServeStaticOptions = {
  path?: string,
  root?: string,
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
