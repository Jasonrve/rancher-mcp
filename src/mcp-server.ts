import { randomUUID } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolResult, type Tool } from '@modelcontextprotocol/sdk/types.js';
import { RancherRequestAuthContext } from './request-auth-context.js';
import { RancherAuthService } from './rancher-auth.js';
import { McpToolCatalog } from './tool-catalog.js';
import { McpToolExecutor } from './tool-executor.js';
import { RancherApiClient } from './rancher-client.js';

export interface RancherMcpServerOptions {
  baseUrl: string;
  token?: string;
  username?: string;
  password?: string;
  fetchImpl?: typeof fetch;
}

export function createRancherMcpServer(options: RancherMcpServerOptions) {
  const authContext = new RancherRequestAuthContext();
  const authService = new RancherAuthService(authContext, {
    baseUrl: options.baseUrl,
    token: options.token,
    username: options.username,
    password: options.password,
    fetchImpl: options.fetchImpl,
  });
  const catalog = new McpToolCatalog();
  const client = new RancherApiClient({
    baseUrl: options.baseUrl,
    authService,
    fetchImpl: options.fetchImpl,
  });
  const executor = new McpToolExecutor(catalog, client);

  const server = new Server(
    { name: 'rancher-mcp', version: '0.1.0' },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: catalog.getTools().map(toTool),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return await executor.execute(request.params.name, normalizeArguments(request.params.arguments));
  });

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true,
  });

  return { server, transport, authContext, authService, catalog, client, executor };
}

function toTool(tool: { name: string; description: string; readOnly: boolean }): Tool {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: {
      readOnlyHint: tool.readOnly,
    },
  };
}

function normalizeArguments(args: unknown): Record<string, unknown> | undefined {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    return undefined;
  }

  return args as Record<string, unknown>;
}

export type { CallToolResult };
