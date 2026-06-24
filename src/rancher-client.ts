import { RancherAuthService } from './rancher-auth.js';

export interface RancherApiClientOptions {
  baseUrl: string;
  authService: RancherAuthService;
  fetchImpl?: typeof fetch;
}

export class RancherApiClient {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: RancherApiClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async listClusters(): Promise<unknown> {
    return await this.requestJson('/v3/clusters', { method: 'GET' });
  }

  async getClusterIdByName(clusterName: string): Promise<string | null> {
    const payload = await this.requestJson<{ data?: Array<{ id?: string; name?: string }> }>('/v3/clusters', { method: 'GET' });
    const cluster = payload.data?.find((item) => item.name === clusterName);
    return cluster?.id ?? null;
  }

  async getClusterKubeconfig(clusterId: string): Promise<string | null> {
    const payload = await this.requestJson<{ config?: string }>(`/v3/clusters/${encodeURIComponent(clusterId)}?action=generateKubeconfig`, {
      method: 'POST',
      body: {},
    });
    return payload.config ?? null;
  }

  async listProjects(): Promise<unknown> {
    return await this.requestJson('/v3/projects', { method: 'GET' });
  }

  async getProjectByName(clusterId: string, projectName: string): Promise<unknown | null> {
    const payload = await this.requestJson<{ data?: Array<{ id?: string; name?: string }> }>(`/v3/projects?clusterId=${encodeURIComponent(clusterId)}`, {
      method: 'GET',
    });
    return payload.data?.find((item) => item.name === projectName) ?? null;
  }

  async createProject(clusterId: string, projectName: string, description?: string | null): Promise<unknown> {
    return await this.requestJson('/v3/projects', {
      method: 'POST',
      body: {
        name: projectName,
        clusterId,
        description: description ?? undefined,
        annotations: {
          'app.kubernetes.io/managed-by': 'rancher-mcp',
        },
      },
    });
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const existing = await this.requestJson<{ annotations?: Record<string, string> }>(`/v3/projects/${encodeURIComponent(projectId)}`, { method: 'GET' });
    if (existing.annotations?.['app.kubernetes.io/managed-by'] !== 'rancher-mcp') {
      return false;
    }

    await this.requestJson(`/v3/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' });
    return true;
  }

  async createNamespace(projectId: string, namespaceName: string): Promise<unknown> {
    const clusterId = projectId.includes(':') ? projectId.split(':')[0] : '';
    return await this.requestJson(`/v3/clusters/${encodeURIComponent(clusterId)}/namespaces`, {
      method: 'POST',
      body: {
        name: namespaceName.toLowerCase(),
        projectId,
        annotations: {
          'app.kubernetes.io/managed-by': 'rancher-mcp',
          'app.kubernetes.io/created-by': 'rancher-mcp',
        },
        labels: {
          'app.kubernetes.io/managed-by': 'rancher-mcp',
        },
      },
    });
  }

  async getNamespace(clusterId: string, namespaceName: string): Promise<unknown | null> {
    return await this.requestJson(`/v3/clusters/${encodeURIComponent(clusterId)}/namespaces/${encodeURIComponent(namespaceName)}`, {
      method: 'GET',
      allowNotFound: true,
    });
  }

  async updateNamespaceProject(clusterId: string, namespaceName: string, newProjectId: string): Promise<unknown | null> {
    const existing = await this.getNamespace(clusterId, namespaceName);
    if (!existing) {
      return null;
    }

    const namespace = existing as { labels?: Record<string, string>; annotations?: Record<string, string> };
    return await this.requestJson(`/v3/clusters/${encodeURIComponent(clusterId)}/namespaces/${encodeURIComponent(namespaceName)}`, {
      method: 'PUT',
      body: {
        name: namespaceName,
        projectId: newProjectId,
        labels: {
          ...(namespace.labels ?? {}),
          'app.kubernetes.io/managed-by': 'rancher-mcp',
        },
        annotations: {
          ...(namespace.annotations ?? {}),
          'app.kubernetes.io/managed-by': 'rancher-mcp',
          'field.cattle.io/projectId': newProjectId,
        },
      },
    });
  }

  async removeNamespaceFromProject(clusterId: string, namespaceName: string): Promise<boolean> {
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const existing = await this.getNamespace(clusterId, namespaceName);
      if (!existing) {
        return false;
      }

      try {
        await this.requestJson(`/v3/clusters/${encodeURIComponent(clusterId)}/namespaces/${encodeURIComponent(namespaceName)}?action=move`, {
          method: 'POST',
          body: { projectId: '' },
        });
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (attempt < 5 && message.includes('object has been modified')) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 250));
          continue;
        }
        throw error;
      }
    }

    return false;
  }

  async listNamespacesByProject(projectId: string): Promise<unknown> {
    const clusterId = projectId.includes(':') ? projectId.split(':')[0] : '';
    return await this.requestJson(`/v3/clusters/${encodeURIComponent(clusterId)}/namespaces?projectId=${encodeURIComponent(projectId)}`, { method: 'GET' });
  }

  async deleteNamespace(clusterId: string, namespaceName: string): Promise<boolean> {
    const existing = await this.requestJson<{ annotations?: Record<string, string> }>(`/v3/clusters/${encodeURIComponent(clusterId)}/namespaces/${encodeURIComponent(namespaceName)}`, { method: 'GET' });
    if (existing.annotations?.['app.kubernetes.io/managed-by'] !== 'rancher-mcp') {
      return false;
    }

    await this.requestJson(`/v3/clusters/${encodeURIComponent(clusterId)}/namespaces/${encodeURIComponent(namespaceName)}`, { method: 'DELETE' });
    return true;
  }

  async ensureNamespaceManagedBy(clusterId: string, namespaceName: string, createdByMcp: boolean): Promise<boolean> {
    const existing = await this.getNamespace(clusterId, namespaceName);
    if (!existing) {
      return false;
    }

    const namespace = existing as { labels?: Record<string, string>; annotations?: Record<string, string>; projectId?: string };
    const labels = { ...(namespace.labels ?? {}) };
    const annotations = { ...(namespace.annotations ?? {}) };
    let changed = false;

    if (labels['app.kubernetes.io/managed-by'] !== 'rancher-mcp') {
      labels['app.kubernetes.io/managed-by'] = 'rancher-mcp';
      changed = true;
    }

    if (annotations['app.kubernetes.io/managed-by'] !== 'rancher-mcp') {
      annotations['app.kubernetes.io/managed-by'] = 'rancher-mcp';
      changed = true;
    }

    if (createdByMcp) {
      if (annotations['app.kubernetes.io/created-by'] !== 'rancher-mcp') {
        annotations['app.kubernetes.io/created-by'] = 'rancher-mcp';
        changed = true;
      }
    } else if (annotations['app.kubernetes.io/created-by'] !== 'imported') {
      annotations['app.kubernetes.io/created-by'] = 'imported';
      changed = true;
    }

    if (!changed) {
      return true;
    }

    await this.requestJson(`/v3/clusters/${encodeURIComponent(clusterId)}/namespaces/${encodeURIComponent(namespaceName)}`, {
      method: 'PUT',
      body: {
        name: namespaceName,
        projectId: namespace.projectId ?? '',
        labels,
        annotations,
      },
    });

    return true;
  }

  async createProjectMember(projectId: string, principalId: string, role: string): Promise<unknown> {
    return await this.requestJson('/v3/projectRoleTemplateBindings', {
      method: 'POST',
      body: {
        projectId,
        roleTemplateId: role,
        ...(this.isGroupPrincipal(principalId) ? { groupPrincipalId: principalId } : { userPrincipalId: principalId }),
      },
    });
  }

  async listProjectMembers(projectId: string): Promise<unknown> {
    return await this.requestJson(`/v3/projectRoleTemplateBindings?projectId=${encodeURIComponent(projectId)}`, { method: 'GET' });
  }

  async deleteProjectMember(bindingId: string): Promise<boolean> {
    await this.requestJson(`/v3/projectRoleTemplateBindings/${encodeURIComponent(bindingId)}`, { method: 'DELETE' });
    return true;
  }

  async getPrincipalByName(principalName: string): Promise<unknown | null> {
    const payload = await this.requestJson<{ data?: Array<{ id?: string; name?: string; loginName?: string; principalType?: string }> }>(
      '/v3/principals?action=search',
      {
        method: 'POST',
        body: { name: principalName, principalType: null },
      },
    );

    const matches = payload.data ?? [];
    const exactMatch = matches.find((item) => item.name?.toLowerCase() === principalName.toLowerCase() || item.loginName?.toLowerCase() === principalName.toLowerCase());
    if (exactMatch) {
      return exactMatch;
    }

    return matches.length === 1 ? matches[0] : null;
  }

  async listFleetGitRepos(): Promise<unknown> {
    return await this.requestJson('/v1/fleet.cattle.io.gitrepos', { method: 'GET' });
  }

  async getFleetGitRepo(repoId: string): Promise<unknown> {
    return await this.requestJson(this.buildFleetRepoPath(repoId), { method: 'GET' });
  }

  async listFleetBundles(): Promise<unknown> {
    return await this.requestJson('/v1/fleet.cattle.io.bundles', { method: 'GET' });
  }

  async getFleetBundleStatus(bundleId: string): Promise<unknown> {
    return await this.requestJson(this.buildFleetBundlePath(bundleId), { method: 'GET' });
  }

  async getFleetSyncStatus(repoId: string): Promise<unknown> {
    return await this.requestJson(this.buildFleetRepoPath(repoId), { method: 'GET' });
  }

  async getFleetDeploymentErrors(repoId?: string): Promise<unknown> {
    return await this.requestJson(repoId ? `/v1/fleet.cattle.io.bundles?gitRepoId=${encodeURIComponent(repoId)}` : '/v1/fleet.cattle.io.bundles?limit=50', { method: 'GET' });
  }

  async createFleetGitRepo(
    name: string,
    repo?: string | null,
    branch?: string | null,
    paths?: readonly string[] | null,
    targets?: Record<string, string> | null,
    namespaceName?: string | null,
  ): Promise<unknown> {
    return await this.requestJson('/v1/fleet.cattle.io.gitrepos', {
      method: 'POST',
      body: {
        type: 'fleet.cattle.io.gitrepo',
        metadata: {
          namespace: namespaceName?.trim() || 'fleet-default',
        },
        name,
        repo: repo ?? undefined,
        branch: branch ?? undefined,
        paths: paths ?? undefined,
        targets: targets ?? undefined,
      },
    });
  }

  async updateFleetGitRepo(
    repoId: string,
    name?: string | null,
    repo?: string | null,
    branch?: string | null,
    paths?: readonly string[] | null,
  ): Promise<unknown> {
    return await this.updateFleetGitRepoFields(repoId, repo, branch, paths, (spec) => {
      if (name?.trim()) {
        spec.name = name.trim();
      }
    });
  }

  async deleteFleetGitRepo(repoId: string): Promise<boolean> {
    await this.requestJson(this.buildFleetRepoPath(repoId), { method: 'DELETE' });
    return true;
  }

  async forceFleetSync(repoId: string, repo?: string | null, branch?: string | null, paths?: readonly string[] | null): Promise<unknown> {
    return await this.updateFleetGitRepoFields(repoId, repo, branch, paths, (spec) => {
      spec.forceSyncGeneration = Date.now();
    }, false);
  }

  async pauseFleetGitRepo(repoId: string, repo?: string | null, branch?: string | null, paths?: readonly string[] | null): Promise<unknown> {
    return await this.updateFleetGitRepoFields(repoId, repo, branch, paths, (spec) => {
      spec.paused = true;
    }, false, false);
  }

  async resumeFleetGitRepo(repoId: string, repo?: string | null, branch?: string | null, paths?: readonly string[] | null): Promise<unknown> {
    return await this.updateFleetGitRepoFields(repoId, repo, branch, paths, (spec) => {
      spec.paused = false;
    }, false, false);
  }

  private buildFleetRepoPath(repoId: string): string {
    const [namespace, name] = this.splitFleetId(repoId, 'fleet-default');
    return `/apis/fleet.cattle.io/v1alpha1/namespaces/${encodeURIComponent(namespace)}/gitrepos/${encodeURIComponent(name)}`;
  }

  private buildFleetBundlePath(bundleId: string): string {
    const [namespace, name] = this.splitFleetId(bundleId, 'fleet-default');
    return `/apis/fleet.cattle.io/v1alpha1/namespaces/${encodeURIComponent(namespace)}/bundles/${encodeURIComponent(name)}`;
  }

  private async updateFleetGitRepoFields(
    repoId: string,
    repo: string | null | undefined,
    branch: string | null | undefined,
    paths: readonly string[] | null | undefined,
    mutateSpec: (spec: Record<string, unknown>) => void,
    requireCoreFields = true,
    readResponseBody = true,
  ): Promise<unknown> {
    const current = await this.requestJson<any>(this.buildFleetRepoPath(repoId), { method: 'GET' });
    const metadata = (current?.metadata ?? {}) as Record<string, unknown>;
    const spec = { ...((current?.spec ?? {}) as Record<string, unknown>) };

    const currentRepo = (current?.spec as Record<string, unknown> | undefined)?.repo ?? (current as Record<string, unknown>)?.repo;
    const currentBranch = (current?.spec as Record<string, unknown> | undefined)?.branch ?? (current as Record<string, unknown>)?.branch;
    const currentPaths = (current?.spec as Record<string, unknown> | undefined)?.paths ?? (current as Record<string, unknown>)?.paths;

    if (repo !== undefined && repo !== null) spec.repo = repo;
    else if (!('repo' in spec) && currentRepo !== undefined) spec.repo = currentRepo;
    if (branch !== undefined && branch !== null) spec.branch = branch;
    else if (!('branch' in spec) && currentBranch !== undefined) spec.branch = currentBranch;
    if (paths !== undefined && paths !== null) spec.paths = [...paths];
    else if (!('paths' in spec) && currentPaths !== undefined) spec.paths = Array.isArray(currentPaths) ? [...currentPaths as unknown[]].map(String) : currentPaths;
    mutateSpec(spec);

    if (requireCoreFields && (!('repo' in spec) || !('branch' in spec) || !('paths' in spec))) {
      throw new Error(`Fleet GitRepo ${repoId} update requires repo, branch, and paths`);
    }

    const body = {
      apiVersion: (current?.apiVersion ?? 'fleet.cattle.io/v1alpha1') as string,
      kind: (current?.kind ?? 'GitRepo') as string,
      metadata: {
        namespace: (metadata.namespace ?? this.splitFleetId(repoId, 'fleet-default')[0]) as string,
        name: (metadata.name ?? this.splitFleetId(repoId, 'fleet-default')[1]) as string,
        resourceVersion: metadata.resourceVersion as string,
      },
      spec,
    };

    return await this.requestJson(this.buildFleetRepoPath(repoId), {
      method: 'PUT',
      body,
      allowNotFound: false,
    });
  }

  private splitFleetId(repoId: string, defaultNamespace: string): [string, string] {
    const slash = repoId.indexOf('/');
    if (slash > 0 && slash + 1 < repoId.length) {
      return [repoId.slice(0, slash), repoId.slice(slash + 1)];
    }

    return [defaultNamespace, repoId];
  }

  private async requestJson<T = unknown>(path: string, init: RequestConfig): Promise<T> {
    const response = await this.fetchImpl(new URL(path, this.options.baseUrl), {
      method: init.method,
      headers: await this.buildHeaders(init.body),
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });

    if (response.status === 404 && init.allowNotFound) {
      return null as T;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Rancher request failed (${response.status}): ${body}`);
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }

  private async buildHeaders(body: unknown): Promise<Headers> {
    const headers = new Headers();
    headers.set('accept', 'application/json');

    const authorization = await this.options.authService.getAuthorizationHeader();
    if (authorization) {
      headers.set('authorization', authorization);
    }

    if (body !== undefined) {
      headers.set('content-type', 'application/json');
    }

    return headers;
  }

  private isGroupPrincipal(principalId: string): boolean {
    return principalId.includes('_org://') || principalId.includes('_team://') || principalId.includes('_group://');
  }
}

type RequestConfig = {
  method: string;
  body?: unknown;
  allowNotFound?: boolean;
};
