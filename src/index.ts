import { type Context, type Next } from 'hono';
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

  return async (context: Context, next: Next) => {

    let reqPath = options.path ?? context.req.path;
    if (reqPath.startsWith('/')) {
      reqPath = '.' + reqPath;
    }

    const pathname = new URL(reqPath, base).pathname;

    const asset = server.getMatchingAsset(pathname);
    if (asset == null) {
      await next();
      return;
    }

    return await server.serveAsset(context.req.raw, asset, { cache: 'never' });
  };
}
