import http from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRancherMcpHttpServer } from '../src/http-server.js';
import { McpToolCatalog } from '../src/tool-catalog.js';
import { McpToolExecutor } from '../src/tool-executor.js';
import { RancherApiClient } from '../src/rancher-client.js';
import { RancherAuthService } from '../src/rancher-auth.js';
import { RancherRequestAuthContext } from '../src/request-auth-context.js';

describe('rancher-mcp', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes the Rancher-only catalog', () => {
    const catalog = new McpToolCatalog();
    const tools = catalog.getTools().map((tool) => tool.name);

    expect(tools).toContain('cluster_list');
    expect(tools).toContain('principal_get_by_name');
    expect(tools).toContain('list_fleet_gitrepos');
    expect(tools).toContain('resume_fleet_gitrepo');
    expect(tools).not.toContain('mcp_token_create');
    expect(tools).not.toContain('kubernetes_get');
  });

  it('routes tool calls to the Rancher client', async () => {
    const calls: string[] = [];
    const client = {
      listClusters: vi.fn(async () => {
        calls.push('listClusters');
        return [{ id: 'c-1', name: 'local' }];
      }),
      getClusterIdByName: vi.fn(async (name: string) => {
        calls.push(`getClusterIdByName:${name}`);
        return 'c-1';
      }),
      getClusterKubeconfig: vi.fn(async (id: string) => {
        calls.push(`getClusterKubeconfig:${id}`);
        return 'kubeconfig';
      }),
      listProjects: vi.fn(async () => []),
      getProjectByName: vi.fn(async () => ({ id: 'p-1', name: 'demo' })),
      createProject: vi.fn(async () => ({ id: 'p-1' })),
      deleteProject: vi.fn(async () => true),
      createNamespace: vi.fn(async () => ({ id: 'n-1' })),
      getNamespace: vi.fn(async () => ({ id: 'n-1' })),
      updateNamespaceProject: vi.fn(async () => ({ id: 'n-1' })),
      removeNamespaceFromProject: vi.fn(async () => true),
      listNamespacesByProject: vi.fn(async () => []),
      deleteNamespace: vi.fn(async () => true),
      ensureNamespaceManagedBy: vi.fn(async () => true),
      createProjectMember: vi.fn(async () => ({ id: 'b-1' })),
      listProjectMembers: vi.fn(async () => []),
      deleteProjectMember: vi.fn(async () => true),
      getPrincipalByName: vi.fn(async () => ({ id: 'u-1', name: 'alice', loginName: 'local://alice' })),
      listFleetGitRepos: vi.fn(async () => ([])),
      getFleetGitRepo: vi.fn(async () => ({ id: 'repo-1' })),
      listFleetBundles: vi.fn(async () => ([])),
      getFleetBundleStatus: vi.fn(async () => ({ status: 'ready' })),
      getFleetSyncStatus: vi.fn(async () => ({ sync: 'ok' })),
      getFleetDeploymentErrors: vi.fn(async () => ([])),
      createFleetGitRepo: vi.fn(async () => ({ id: 'repo-1' })),
      updateFleetGitRepo: vi.fn(async () => ({ id: 'repo-1' })),
      deleteFleetGitRepo: vi.fn(async () => true),
      forceFleetSync: vi.fn(async () => ({ forced: true })),
      pauseFleetGitRepo: vi.fn(async () => ({ paused: true })),
      resumeFleetGitRepo: vi.fn(async () => ({ resumed: true })),
    } satisfies Partial<RancherApiClient> & Record<string, unknown>;

    const executor = new McpToolExecutor(new McpToolCatalog(), client as RancherApiClient);
    const result = await executor.execute('cluster_get_id', { clusterName: 'local' });

    expect(calls).toEqual(['getClusterIdByName:local']);
    expect(client.getClusterIdByName).toHaveBeenCalledWith('local');
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('c-1');
  });

  it('prefers the incoming Authorization header and falls back to credentials', async () => {
    const authContext = new RancherRequestAuthContext();
    const authService = new RancherAuthService(authContext, {
      baseUrl: 'https://rancher.example.com',
      token: 'fallback-token',
      username: 'admin',
      password: 'secret',
    });

    await authContext.run('Bearer inbound-token', async () => {
      await expect(authService.getAuthorizationHeader()).resolves.toBe('Bearer inbound-token');
    });

    await authContext.run(undefined, async () => {
      await expect(authService.getAuthorizationHeader()).resolves.toBe('Bearer fallback-token');
    });

    const loginFetch = vi.fn(async () => new Response(JSON.stringify({ token: 'created-token' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    const loginService = new RancherAuthService(new RancherRequestAuthContext(), {
      baseUrl: 'https://rancher.example.com',
      username: 'admin',
      password: 'secret',
      fetchImpl: loginFetch,
    });

    await expect(loginService.getAuthorizationHeader()).resolves.toBe('Bearer created-token');
    expect(loginFetch).toHaveBeenCalledOnce();
  });

  it('sends the active Authorization header to Rancher API calls', async () => {
    const authContext = new RancherRequestAuthContext();
    const authService = new RancherAuthService(authContext, { baseUrl: 'https://rancher.example.com' });
    const observedHeaders: string[] = [];

    const fetchImpl: typeof fetch = vi.fn(async (input, init) => {
      const request = new Request(input, init);
      observedHeaders.push(request.headers.get('authorization') ?? '');
      return new Response(JSON.stringify({ data: [{ id: 'c-1', name: 'local' }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const client = new RancherApiClient({
      baseUrl: 'https://rancher.example.com',
      authService,
      fetchImpl,
    });

    await authContext.run('Bearer pass-through-token', async () => {
      const clusters = await client.listClusters();
      expect(clusters).toEqual({ data: [{ id: 'c-1', name: 'local' }] });
    });

    expect(observedHeaders).toEqual(['Bearer pass-through-token']);
  });

  it('serves health checks on the HTTP surface', async () => {
    const { httpServer } = await createRancherMcpHttpServer({
      baseUrl: 'https://rancher.example.com',
      fetchImpl: vi.fn(async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })),
      route: '/mcp',
    });

    const url = await listen(httpServer);
    try {
      const response = await fetch(`${url}/health`);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ ok: true });
    } finally {
      await close(httpServer);
    }
  });
});

function listen(server: http.Server): Promise<string> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (typeof address !== 'object' || !address) {
        reject(new Error('Server did not expose an address'));
        return;
      }
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
