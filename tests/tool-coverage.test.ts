import { describe, expect, it, vi } from 'vitest';
import { McpToolCatalog } from '../src/tool-catalog.js';
import { McpToolExecutor } from '../src/tool-executor.js';
import type { RancherApiClient } from '../src/rancher-client.js';

const toolCases = [
  { toolName: 'cluster_list', methodName: 'listClusters', args: undefined, returns: [{ id: 'c-1', name: 'local' }], expectedFragment: 'c-1' },
  { toolName: 'cluster_get_id', methodName: 'getClusterIdByName', args: { clusterName: 'local' }, returns: 'c-1', expectedFragment: 'c-1' },
  { toolName: 'cluster_get_kubeconfig', methodName: 'getClusterKubeconfig', args: { clusterId: 'c-1' }, returns: 'kubeconfig-yaml', expectedFragment: 'kubeconfig-yaml' },
  { toolName: 'project_list', methodName: 'listProjects', args: undefined, returns: [{ id: 'p-1', name: 'demo' }], expectedFragment: 'p-1' },
  { toolName: 'project_get', methodName: 'getProjectByName', args: { clusterId: 'c-1', projectName: 'demo' }, returns: { id: 'p-1', name: 'demo' }, expectedFragment: 'p-1' },
  { toolName: 'project_create', methodName: 'createProject', args: { clusterId: 'c-1', projectName: 'demo', description: 'hello' }, returns: { id: 'p-1', name: 'demo' }, expectedFragment: 'demo' },
  { toolName: 'project_delete', methodName: 'deleteProject', args: { projectId: 'p-1' }, returns: true, expectedFragment: '"deleted": true' },
  { toolName: 'namespace_create', methodName: 'createNamespace', args: { projectId: 'c-1:p-1', namespaceName: 'Demo-Ns' }, returns: { id: 'n-1', name: 'demo-ns' }, expectedFragment: 'demo-ns' },
  { toolName: 'namespace_get', methodName: 'getNamespace', args: { clusterId: 'c-1', namespaceName: 'demo-ns' }, returns: { id: 'n-1', name: 'demo-ns' }, expectedFragment: 'n-1' },
  { toolName: 'namespace_update_project', methodName: 'updateNamespaceProject', args: { clusterId: 'c-1', namespaceName: 'demo-ns', newProjectId: 'c-1:p-2' }, returns: { id: 'n-1', projectId: 'c-1:p-2' }, expectedFragment: 'p-2' },
  { toolName: 'namespace_remove_project', methodName: 'removeNamespaceFromProject', args: { clusterId: 'c-1', namespaceName: 'demo-ns' }, returns: true, expectedFragment: '"removed": true' },
  { toolName: 'namespace_list_by_project', methodName: 'listNamespacesByProject', args: { projectId: 'c-1:p-1' }, returns: [{ id: 'n-1', name: 'demo-ns' }], expectedFragment: 'demo-ns' },
  { toolName: 'namespace_delete', methodName: 'deleteNamespace', args: { clusterId: 'c-1', namespaceName: 'demo-ns' }, returns: true, expectedFragment: '"deleted": true' },
  { toolName: 'namespace_ensure_managed_by', methodName: 'ensureNamespaceManagedBy', args: { clusterId: 'c-1', namespaceName: 'demo-ns', createdByMcp: true }, returns: true, expectedFragment: '"updated": true' },
  { toolName: 'project_member_create', methodName: 'createProjectMember', args: { projectId: 'c-1:p-1', principalId: 'u-1', role: 'project-member' }, returns: { id: 'b-1' }, expectedFragment: 'b-1' },
  { toolName: 'project_member_list', methodName: 'listProjectMembers', args: { projectId: 'c-1:p-1' }, returns: [{ id: 'b-1' }], expectedFragment: 'b-1' },
  { toolName: 'project_member_delete', methodName: 'deleteProjectMember', args: { bindingId: 'b-1' }, returns: true, expectedFragment: '"deleted": true' },
  { toolName: 'principal_get_by_name', methodName: 'getPrincipalByName', args: { principalName: 'alice' }, returns: { id: 'u-1', name: 'alice' }, expectedFragment: 'alice' },
  { toolName: 'list_fleet_gitrepos', methodName: 'listFleetGitRepos', args: undefined, returns: [{ id: 'repo-1' }], expectedFragment: 'repo-1' },
  { toolName: 'get_fleet_gitrepo', methodName: 'getFleetGitRepo', args: { id: 'repo-1' }, returns: { id: 'repo-1', name: 'apps' }, expectedFragment: 'apps' },
  { toolName: 'list_fleet_bundles', methodName: 'listFleetBundles', args: undefined, returns: [{ id: 'bundle-1' }], expectedFragment: 'bundle-1' },
  { toolName: 'get_fleet_bundle_status', methodName: 'getFleetBundleStatus', args: { bundleId: 'bundle-1' }, returns: { status: 'ready' }, expectedFragment: 'ready' },
  { toolName: 'get_fleet_sync_status', methodName: 'getFleetSyncStatus', args: { gitRepoId: 'repo-1' }, returns: { sync: 'ok' }, expectedFragment: 'ok' },
  { toolName: 'get_fleet_deployment_errors', methodName: 'getFleetDeploymentErrors', args: { gitRepoId: 'repo-1' }, returns: [{ id: 'err-1', message: 'boom' }], expectedFragment: 'boom' },
  { toolName: 'create_fleet_gitrepo', methodName: 'createFleetGitRepo', args: { name: 'apps', repo: 'https://github.com/example/apps', branch: 'main', paths: ['clusters/dev'], targets: { cluster: 'dev' } }, returns: { id: 'repo-1', name: 'apps' }, expectedFragment: 'apps' },
  { toolName: 'update_fleet_gitrepo', methodName: 'updateFleetGitRepo', args: { id: 'repo-1', name: 'apps', repo: 'https://github.com/example/apps', branch: 'main', paths: ['clusters/dev'] }, returns: { id: 'repo-1', name: 'apps' }, expectedFragment: 'repo-1' },
  { toolName: 'delete_fleet_gitrepo', methodName: 'deleteFleetGitRepo', args: { id: 'repo-1' }, returns: true, expectedFragment: '"deleted": true' },
  { toolName: 'force_fleet_sync', methodName: 'forceFleetSync', args: { gitRepoId: 'repo-1' }, returns: { forced: true }, expectedFragment: 'forced' },
  { toolName: 'pause_fleet_gitrepo', methodName: 'pauseFleetGitRepo', args: { gitRepoId: 'repo-1' }, returns: { paused: true }, expectedFragment: 'paused' },
  { toolName: 'resume_fleet_gitrepo', methodName: 'resumeFleetGitRepo', args: { gitRepoId: 'repo-1' }, returns: { resumed: true }, expectedFragment: 'resumed' },
] as const;

describe('rancher-mcp tool coverage', () => {
  it('catalog exposes every Rancher MCP tool', () => {
    const catalog = new McpToolCatalog();
    const toolNames = catalog.getTools().map((tool) => tool.name);

    expect(toolNames).toEqual(toolCases.map((toolCase) => toolCase.toolName));
  });

  describe.each(toolCases)('$toolName', (toolCase) => {
    it('dispatches to the matching Rancher client method', async () => {
      const client = createClientMock({ [toolCase.methodName]: toolCase.returns });
      const executor = new McpToolExecutor(new McpToolCatalog(), client as RancherApiClient);
      const result = await executor.execute(toolCase.toolName, toolCase.args as Record<string, unknown> | undefined);

      expect(client.__calls).toEqual([{ method: toolCase.methodName, args: expectedCallArgs(toolCase.args, toolCase.toolName) }]);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain(toolCase.expectedFragment);
    });
  });
});

function expectedCallArgs(args: Record<string, unknown> | undefined, toolName?: string): unknown[] {
  if (!args) {
    return toolName === 'create_fleet_gitrepo' ? [undefined] : [];
  }

  const values = Object.values(args);
  if (toolName === 'create_fleet_gitrepo') {
    return [...values, undefined];
  }
  if (toolName === 'force_fleet_sync' || toolName === 'pause_fleet_gitrepo' || toolName === 'resume_fleet_gitrepo') {
    return [...values, undefined, undefined, undefined];
  }
  return values;
}

function createClientMock(returns: Record<string, unknown>) {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const mocks = new Map<string, ReturnType<typeof vi.fn>>();

  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === '__calls') {
        return calls;
      }

      if (prop === '__mocks') {
        return mocks;
      }

      if (typeof prop !== 'string') {
        return undefined;
      }

      if (!mocks.has(prop)) {
        const fn = vi.fn(async (...args: unknown[]) => {
          calls.push({ method: prop, args });
          return returns[prop];
        });
        mocks.set(prop, fn);
      }

      return mocks.get(prop);
    },
  };

  return new Proxy({}, handler) as Record<string, unknown> & {
    __calls: Array<{ method: string; args: unknown[] }>;
    __mocks: Map<string, ReturnType<typeof vi.fn>>;
  };
}
