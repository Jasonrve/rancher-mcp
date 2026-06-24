import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createRancherMcpHttpServer } from './http-server.js';

const baseUrl = process.env.RANCHER_URL ?? 'http://127.0.0.1:8443';
const transportMode = process.env.RANCHER_MCP_TRANSPORT ?? 'http';

async function main(): Promise<void> {
  if (transportMode === 'stdio') {
    const { server } = await import('./mcp-server.js').then(({ createRancherMcpServer }) => createRancherMcpServer({
      baseUrl,
      token: process.env.RANCHER_TOKEN,
      username: process.env.RANCHER_USERNAME,
      password: process.env.RANCHER_PASSWORD,
    }));
    await server.connect(new StdioServerTransport());
    return;
  }

  const { httpServer, route } = await createRancherMcpHttpServer({
    baseUrl,
    token: process.env.RANCHER_TOKEN,
    username: process.env.RANCHER_USERNAME,
    password: process.env.RANCHER_PASSWORD,
    route: process.env.RANCHER_MCP_PATH ?? '/mcp',
  });

  const port = Number(process.env.PORT ?? '3000');
  httpServer.listen(port, () => {
    const address = httpServer.address();
    const actualPort = typeof address === 'object' && address ? address.port : port;
    // eslint-disable-next-line no-console
    console.log(`rancher-mcp listening on http://127.0.0.1:${actualPort}${route}`);
  });
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
