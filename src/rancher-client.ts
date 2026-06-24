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
          'app.kubernetes.io/managed-by': 'rancher-devops-operator',
        },
      },
    });
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const existing = await this.requestJson<{ annotations?: Record<string, string> }>(`/v3/projects/${encodeURIComponent(projectId)}`, { method: 'GET' });
    if (existing.annotations?.['app.kubernetes.io/managed-by'] !== 'rancher-devops-operator') {
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
          'app.kubernetes.io/managed-by': 'rancher-devops-operator',
          'app.kubernetes.io/created-by': 'rancher-devops-operator',
        },
        labels: {
          'app.kubernetes.io/managed-by': 'rancher-devops-operator',
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
          'app.kubernetes.io/managed-by': 'rancher-devops-operator',
        },
        annotations: {
          ...(namespace.annotations ?? {}),
          'app.kubernetes.io/managed-by': 'rancher-devops-operator',
          'field.cattle.io/projectId': newProjectId,
        },
      },
    });
  }

  async removeNamespaceFromProject(clusterId: string, namespaceName: string): Promise<boolean> {
    const existing = await this.getNamespace(clusterId, namespaceName);
    if (!existing) {
      return false;
    }

    await this.requestJson(`/v3/clusters/${encodeURIComponent(clusterId)}/namespaces/${encodeURIComponent(namespaceName)}?action=move`, {
      method: 'POST',
      body: { projectId: '' },
    });

    return true;
  }

  async listNamespacesByProject(projectId: string): Promise<unknown> {
    const clusterId = projectId.includes(':') ? projectId.split(':')[0] : '';
    return await this.requestJson(`/v3/clusters/${encodeURIComponent(clusterId)}/namespaces?projectId=${encodeURIComponent(projectId)}`, { method: 'GET' });
  }

  async deleteNamespace(clusterId: string, namespaceName: string): Promise<boolean> {
    const existing = await this.requestJson<{ annotations?: Record<string, string> }>(`/v3/clusters/${encodeURIComponent(clusterId)}/namespaces/${encodeURIComponent(namespaceName)}`, { method: 'GET' });
    if (existing.annotations?.['app.kubernetes.io/managed-by'] !== 'rancher-devops-operator') {
      return false;
    }

    await this.requestJson(`/v3/clusters/${encodeURIComponent(clusterId)}/namespaces/${encodeURIComponent(namespaceName)}`, { method: 'DELETE' });
    return true;
  }

  async ensureNamespaceManagedBy(clusterId: string, namespaceName: string, createdByOperator: boolean): Promise<boolean> {
    const existing = await this.getNamespace(clusterId, namespaceName);
    if (!existing) {
      return false;
    }

    const namespace = existing as { labels?: Record<string, string>; annotations?: Record<string, string>; projectId?: string };
    const labels = { ...(namespace.labels ?? {}) };
    const annotations = { ...(namespace.annotations ?? {}) };
    let changed = false;

    if (labels['app.kubernetes.io/managed-by'] !== 'rancher-devops-operator') {
      labels['app.kubernetes.io/managed-by'] = 'rancher-devops-operator';
      changed = true;
    }

    if (annotations['app.kubernetes.io/managed-by'] !== 'rancher-devops-operator') {
      annotations['app.kubernetes.io/managed-by'] = 'rancher-devops-operator';
      changed = true;
    }

    if (createdByOperator) {
      if (annotations['app.kubernetes.io/created-by'] !== 'rancher-devops-operator') {
        annotations['app.kubernetes.io/created-by'] = 'rancher-devops-operator';
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
    return await this.requestJson(`/v1/fleet.cattle.io.gitrepos/${encodeURIComponent(repoId)}`, { method: 'GET' });
  }

  async listFleetBundles(): Promise<unknown> {
    return await this.requestJson('/v1/fleet.cattle.io.bundles', { method: 'GET' });
  }

  async getFleetBundleStatus(bundleId: string): Promise<unknown> {
    return await this.requestJson(`/v1/fleet.cattle.io.bundles/${encodeURIComponent(bundleId)}`, { method: 'GET' });
  }

  async getFleetSyncStatus(repoId: string): Promise<unknown> {
    return await this.requestJson(`/v1/fleet.cattle.io.gitrepos/${encodeURIComponent(repoId)}`, { method: 'GET' });
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
  ): Promise<unknown> {
    return await this.requestJson('/v1/fleet.cattle.io.gitrepos', {
      method: 'POST',
      body: {
        type: 'fleet.cattle.io.gitrepo',
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
    return await this.requestJson(`/v1/fleet.cattle.io.gitrepos/${encodeURIComponent(repoId)}`, {
      method: 'PUT',
      body: {
        id: repoId,
        name: name ?? undefined,
        repo: repo ?? undefined,
        branch: branch ?? undefined,
        paths: paths ?? undefined,
      },
    });
  }

  async deleteFleetGitRepo(repoId: string): Promise<boolean> {
    await this.requestJson(`/v1/fleet.cattle.io.gitrepos/${encodeURIComponent(repoId)}`, { method: 'DELETE' });
    return true;
  }

  async forceFleetSync(repoId: string): Promise<unknown> {
    return await this.requestJson(`/v1/fleet.cattle.io.gitrepos/${encodeURIComponent(repoId)}?action=forceSync`, {
      method: 'POST',
      body: {},
    });
  }

  async pauseFleetGitRepo(repoId: string): Promise<unknown> {
    return await this.requestJson(`/v1/fleet.cattle.io.gitrepos/${encodeURIComponent(repoId)}?action=pause`, {
      method: 'POST',
      body: {},
    });
  }

  async resumeFleetGitRepo(repoId: string): Promise<unknown> {
    return await this.requestJson(`/v1/fleet.cattle.io.gitrepos/${encodeURIComponent(repoId)}?action=resume`, {
      method: 'POST',
      body: {},
    });
  }

  private async requestJson<T = unknown>(path: string, init: RequestConfig): Promise<T> {
    const response = await this.fetchImpl(new URL(path, this.options.baseUrl), {
      method: init.method,
      headers: this.buildHeaders(init.body),
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

  private buildHeaders(body: unknown): Headers {
    const headers = new Headers();
    headers.set('accept', 'application/json');

    const authorization = this.options.authService.getAuthorizationHeader();
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
