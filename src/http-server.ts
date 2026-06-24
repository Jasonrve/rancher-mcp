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
    const parsedBody = await readRequestBody(req);
    await runtime.authContext.run(authorization, async () => {
      await runtime.transport.handleRequest(req, res, parsedBody);
    });
  });

  async function readRequestBody(req: http.IncomingMessage): Promise<unknown> {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return undefined;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    if (chunks.length === 0) {
      return undefined;
    }

    const raw = Buffer.concat(chunks).toString('utf8').trim();
    if (!raw) {
      return undefined;
    }

    return JSON.parse(raw) as unknown;
  }

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
