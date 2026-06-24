import http from 'node:http';
import { createRancherMcpServer, type RancherMcpServerOptions } from './mcp-server.js';

export interface RancherMcpHttpServerOptions extends RancherMcpServerOptions {
  route?: string;
}

export async function createRancherMcpHttpServer(options: RancherMcpHttpServerOptions) {
  const route = options.route ?? '/mcp';
  const runtime = createRancherMcpServer(options);
  await runtime.server.connect(runtime.transport);

  const httpServer = http.createServer(async (req, res) => {
    if (req.url === '/health' || req.url === '/healthz') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (!req.url?.startsWith(route)) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    const authorization = typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined;
    await runtime.authContext.run(authorization, async () => {
      await runtime.transport.handleRequest(req, res);
    });
  });

  return {
    httpServer,
    route,
    server: runtime.server,
    transport: runtime.transport,
    authContext: runtime.authContext,
    authService: runtime.authService,
    catalog: runtime.catalog,
    client: runtime.client,
    executor: runtime.executor,
  };
}
