import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpToolCatalog } from './tool-catalog.js';
import { RancherApiClient } from './rancher-client.js';

export class McpToolExecutor {
  constructor(
    private readonly catalog: McpToolCatalog,
    private readonly rancherClient: RancherApiClient,
  ) {}

  async execute(toolName: string, argumentsObject?: Record<string, unknown>): Promise<CallToolResult> {
    const tool = this.catalog.find(toolName);
    if (!tool) {
      return this.wrapText(`Unknown tool '${toolName}'.`);
    }

    switch (tool.name) {
      case 'cluster_list':
        return this.wrapJson(await this.rancherClient.listClusters());
      case 'cluster_get_id':
        return this.wrapJson({
          clusterName: this.requireString(argumentsObject, 'clusterName', 'name'),
          clusterId: await this.rancherClient.getClusterIdByName(this.requireString(argumentsObject, 'clusterName', 'name')),
        });
      case 'cluster_get_kubeconfig':
        return this.wrapJson({
          clusterId: this.requireString(argumentsObject, 'clusterId', 'id'),
          kubeconfig: await this.rancherClient.getClusterKubeconfig(this.requireString(argumentsObject, 'clusterId', 'id')),
        });

      case 'project_list':
        return this.wrapJson(await this.rancherClient.listProjects());
      case 'project_get':
        return this.wrapJson(await this.rancherClient.getProjectByName(
          this.requireString(argumentsObject, 'clusterId', 'cluster_id'),
          this.requireString(argumentsObject, 'projectName', 'name'),
        ));
      case 'project_create':
        return this.wrapJson(await this.rancherClient.createProject(
          this.requireString(argumentsObject, 'clusterId', 'cluster_id'),
          this.requireString(argumentsObject, 'projectName', 'name'),
          this.getString(argumentsObject, 'description'),
        ));
      case 'project_delete':
        return this.wrapJson({
          projectId: this.requireString(argumentsObject, 'projectId', 'id'),
          deleted: await this.rancherClient.deleteProject(this.requireString(argumentsObject, 'projectId', 'id')),
        });

      case 'namespace_create':
        return this.wrapJson(await this.rancherClient.createNamespace(
          this.requireString(argumentsObject, 'projectId', 'project_id'),
          this.requireString(argumentsObject, 'namespaceName', 'name'),
        ));
      case 'namespace_get':
        return this.wrapJson(await this.rancherClient.getNamespace(
          this.requireString(argumentsObject, 'clusterId', 'cluster_id'),
          this.requireString(argumentsObject, 'namespaceName', 'name'),
        ));
      case 'namespace_update_project':
        return this.wrapJson(await this.rancherClient.updateNamespaceProject(
          this.requireString(argumentsObject, 'clusterId', 'cluster_id'),
          this.requireString(argumentsObject, 'namespaceName', 'name'),
          this.requireString(argumentsObject, 'newProjectId', 'projectId', 'project_id'),
        ));
      case 'namespace_remove_project':
        return this.wrapJson({
          clusterId: this.requireString(argumentsObject, 'clusterId', 'cluster_id'),
          namespaceName: this.requireString(argumentsObject, 'namespaceName', 'name'),
          removed: await this.rancherClient.removeNamespaceFromProject(
            this.requireString(argumentsObject, 'clusterId', 'cluster_id'),
            this.requireString(argumentsObject, 'namespaceName', 'name'),
          ),
        });
      case 'namespace_list_by_project':
        return this.wrapJson(await this.rancherClient.listNamespacesByProject(this.requireString(argumentsObject, 'projectId', 'project_id')));
      case 'namespace_delete':
        return this.wrapJson({
          clusterId: this.requireString(argumentsObject, 'clusterId', 'cluster_id'),
          namespaceName: this.requireString(argumentsObject, 'namespaceName', 'name'),
          deleted: await this.rancherClient.deleteNamespace(
            this.requireString(argumentsObject, 'clusterId', 'cluster_id'),
            this.requireString(argumentsObject, 'namespaceName', 'name'),
          ),
        });
      case 'namespace_ensure_managed_by':
        return this.wrapJson({
          clusterId: this.requireString(argumentsObject, 'clusterId', 'cluster_id'),
          namespaceName: this.requireString(argumentsObject, 'namespaceName', 'name'),
          createdByMcp: this.requireBool(argumentsObject, 'createdByMcp', 'created_by_mcp'),
          updated: await this.rancherClient.ensureNamespaceManagedBy(
            this.requireString(argumentsObject, 'clusterId', 'cluster_id'),
            this.requireString(argumentsObject, 'namespaceName', 'name'),
            this.requireBool(argumentsObject, 'createdByMcp', 'created_by_mcp'),
          ),
        });

      case 'project_member_create':
        return this.wrapJson(await this.rancherClient.createProjectMember(
          this.requireString(argumentsObject, 'projectId', 'project_id'),
          this.requireString(argumentsObject, 'principalId', 'principal_id'),
          this.requireString(argumentsObject, 'role'),
        ));
      case 'project_member_list':
        return this.wrapJson(await this.rancherClient.listProjectMembers(this.requireString(argumentsObject, 'projectId', 'project_id')));
      case 'project_member_delete':
        return this.wrapJson({
          bindingId: this.requireString(argumentsObject, 'bindingId', 'id'),
          deleted: await this.rancherClient.deleteProjectMember(this.requireString(argumentsObject, 'bindingId', 'id')),
        });
      case 'principal_get_by_name':
        return this.wrapJson(await this.rancherClient.getPrincipalByName(this.requireString(argumentsObject, 'principalName', 'name')));

      case 'list_fleet_gitrepos':
        return this.wrapJson(await this.rancherClient.listFleetGitRepos());
      case 'get_fleet_gitrepo':
        return this.wrapJson(await this.rancherClient.getFleetGitRepo(this.requireString(argumentsObject, 'id', 'gitRepoId', 'name', 'gitRepoName')));
      case 'list_fleet_bundles':
        return this.wrapJson(await this.rancherClient.listFleetBundles());
      case 'get_fleet_bundle_status':
        return this.wrapJson(await this.rancherClient.getFleetBundleStatus(this.requireString(argumentsObject, 'id', 'bundleId', 'name', 'bundleName')));
      case 'get_fleet_sync_status':
        return this.wrapJson(await this.rancherClient.getFleetSyncStatus(this.requireString(argumentsObject, 'gitRepoId', 'id', 'name', 'gitRepoName')));
      case 'get_fleet_deployment_errors':
        return this.wrapJson(await this.rancherClient.getFleetDeploymentErrors(this.getString(argumentsObject, 'gitRepoId') ?? this.getString(argumentsObject, 'id') ?? this.getString(argumentsObject, 'name') ?? this.getString(argumentsObject, 'gitRepoName') ?? undefined));
      case 'create_fleet_gitrepo':
        return this.wrapJson(await this.rancherClient.createFleetGitRepo(
          this.requireString(argumentsObject, 'name', 'gitRepoName'),
          this.getString(argumentsObject, 'repo'),
          this.getString(argumentsObject, 'branch'),
          this.getStringArray(argumentsObject, 'paths'),
          this.getStringMap(argumentsObject, 'targets'),
          this.getString(argumentsObject, 'namespaceName') ?? this.getString(argumentsObject, 'namespace'),
        ));
      case 'update_fleet_gitrepo':
        return this.wrapJson(await this.rancherClient.updateFleetGitRepo(
          this.requireString(argumentsObject, 'id', 'gitRepoId', 'name', 'gitRepoName'),
          this.getString(argumentsObject, 'name'),
          this.getString(argumentsObject, 'repo'),
          this.getString(argumentsObject, 'branch'),
          this.getStringArray(argumentsObject, 'paths'),
        ));
      case 'delete_fleet_gitrepo':
        return this.wrapJson({ deleted: await this.rancherClient.deleteFleetGitRepo(this.requireString(argumentsObject, 'id', 'gitRepoId', 'name', 'gitRepoName')) });
      case 'force_fleet_sync':
        return this.wrapJson(await this.rancherClient.forceFleetSync(
          this.requireString(argumentsObject, 'gitRepoId', 'id', 'name', 'gitRepoName'),
          this.getString(argumentsObject, 'repo'),
          this.getString(argumentsObject, 'branch'),
          this.getStringArray(argumentsObject, 'paths'),
        ));
      case 'pause_fleet_gitrepo':
        return this.wrapJson(await this.rancherClient.pauseFleetGitRepo(
          this.requireString(argumentsObject, 'gitRepoId', 'id', 'name', 'gitRepoName'),
          this.getString(argumentsObject, 'repo'),
          this.getString(argumentsObject, 'branch'),
          this.getStringArray(argumentsObject, 'paths'),
        ));
      case 'resume_fleet_gitrepo':
        return this.wrapJson(await this.rancherClient.resumeFleetGitRepo(
          this.requireString(argumentsObject, 'gitRepoId', 'id', 'name', 'gitRepoName'),
          this.getString(argumentsObject, 'repo'),
          this.getString(argumentsObject, 'branch'),
          this.getStringArray(argumentsObject, 'paths'),
        ));
      default:
        return this.wrapText(`Tool '${toolName}' is enabled but no executor was registered.`);
    }
  }

  private requireString(argumentsObject: Record<string, unknown> | undefined, ...names: string[]): string {
    for (const name of names) {
      const value = this.getString(argumentsObject, name);
      if (value && value.trim()) {
        return value;
      }
    }

    throw new Error(`Missing required argument: ${names.join(' or ')}`);
  }

  private requireBool(argumentsObject: Record<string, unknown> | undefined, ...names: string[]): boolean {
    for (const name of names) {
      const value = this.getBool(argumentsObject, name);
      if (typeof value === 'boolean') {
        return value;
      }
    }

    throw new Error(`Missing required boolean argument: ${names.join(' or ')}`);
  }

  private getString(argumentsObject: Record<string, unknown> | undefined, name: string): string | undefined {
    const value = argumentsObject?.[name];
    return typeof value === 'string' ? value : undefined;
  }

  private getBool(argumentsObject: Record<string, unknown> | undefined, name: string): boolean | undefined {
    const value = argumentsObject?.[name];
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      return value.trim().toLowerCase() === 'true';
    }

    return undefined;
  }

  private getStringArray(argumentsObject: Record<string, unknown> | undefined, name: string): string[] | undefined {
    const value = argumentsObject?.[name];
    if (!Array.isArray(value)) {
      return undefined;
    }

    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  private getStringMap(argumentsObject: Record<string, unknown> | undefined, name: string): Record<string, string> | undefined {
    const value = argumentsObject?.[name];
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    const entries = Object.entries(value).filter(([, entry]) => typeof entry === 'string') as Array<[string, string]>;
    return entries.length ? Object.fromEntries(entries) : undefined;
  }

  private wrapText(text: string): CallToolResult {
    return {
      content: [{ type: 'text', text }],
    };
  }

  private wrapJson(data: unknown): CallToolResult {
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) ?? 'null' }],
    };
  }
}
