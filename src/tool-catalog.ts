export type ToolCategory = 'rancher' | 'fleet';

export interface McpToolDefinition {
  name: string;
  description: string;
  readOnly: boolean;
  category: ToolCategory;
}

const TOOLS: readonly McpToolDefinition[] = [
  { name: 'cluster_list', description: 'List Rancher clusters.', readOnly: true, category: 'rancher' },
  { name: 'cluster_get_id', description: 'Resolve a Rancher cluster name to its cluster ID.', readOnly: true, category: 'rancher' },
  { name: 'cluster_get_kubeconfig', description: 'Fetch a cluster kubeconfig from Rancher.', readOnly: true, category: 'rancher' },

  { name: 'project_list', description: 'List Rancher projects.', readOnly: true, category: 'rancher' },
  { name: 'project_get', description: 'Get a Rancher project by cluster and project name.', readOnly: true, category: 'rancher' },
  { name: 'project_create', description: 'Create a Rancher project.', readOnly: false, category: 'rancher' },
  { name: 'project_delete', description: 'Delete a Rancher project.', readOnly: false, category: 'rancher' },

  { name: 'namespace_create', description: 'Create a namespace inside a Rancher project.', readOnly: false, category: 'rancher' },
  { name: 'namespace_get', description: 'Get a namespace by cluster and name.', readOnly: true, category: 'rancher' },
  { name: 'namespace_update_project', description: 'Move a namespace to another Rancher project.', readOnly: false, category: 'rancher' },
  { name: 'namespace_remove_project', description: 'Remove a namespace from its Rancher project.', readOnly: false, category: 'rancher' },
  { name: 'namespace_list_by_project', description: 'List namespaces for a Rancher project.', readOnly: true, category: 'rancher' },
  { name: 'namespace_delete', description: 'Delete a namespace from a Rancher cluster.', readOnly: false, category: 'rancher' },
  { name: 'namespace_ensure_managed_by', description: 'Mark a namespace as managed or unmanaged by rancher-mcp.', readOnly: false, category: 'rancher' },

  { name: 'project_member_create', description: 'Add a member to a Rancher project.', readOnly: false, category: 'rancher' },
  { name: 'project_member_list', description: 'List Rancher project members.', readOnly: true, category: 'rancher' },
  { name: 'project_member_delete', description: 'Delete a Rancher project member binding.', readOnly: false, category: 'rancher' },
  { name: 'principal_get_by_name', description: 'Resolve a Rancher principal by name.', readOnly: true, category: 'rancher' },

  { name: 'list_fleet_gitrepos', description: 'List Fleet GitRepos.', readOnly: true, category: 'fleet' },
  { name: 'get_fleet_gitrepo', description: 'Get a Fleet GitRepo by id or name.', readOnly: true, category: 'fleet' },
  { name: 'list_fleet_bundles', description: 'List Fleet bundles.', readOnly: true, category: 'fleet' },
  { name: 'get_fleet_bundle_status', description: 'Return the status for a Fleet bundle.', readOnly: true, category: 'fleet' },
  { name: 'get_fleet_sync_status', description: 'Return the sync status for a Fleet GitRepo or bundle.', readOnly: true, category: 'fleet' },
  { name: 'get_fleet_deployment_errors', description: 'Return Fleet deployment errors or failure summaries.', readOnly: true, category: 'fleet' },

  { name: 'create_fleet_gitrepo', description: 'Create a Fleet GitRepo.', readOnly: false, category: 'fleet' },
  { name: 'update_fleet_gitrepo', description: 'Update a Fleet GitRepo.', readOnly: false, category: 'fleet' },
  { name: 'delete_fleet_gitrepo', description: 'Delete a Fleet GitRepo.', readOnly: false, category: 'fleet' },
  { name: 'force_fleet_sync', description: 'Force a Fleet sync.', readOnly: false, category: 'fleet' },
  { name: 'pause_fleet_gitrepo', description: 'Pause a Fleet GitRepo.', readOnly: false, category: 'fleet' },
  { name: 'resume_fleet_gitrepo', description: 'Resume a Fleet GitRepo.', readOnly: false, category: 'fleet' },
] as const;

export class McpToolCatalog {
  getTools(): readonly McpToolDefinition[] {
    return TOOLS;
  }

  find(name: string): McpToolDefinition | undefined {
    return TOOLS.find((tool) => tool.name.toLowerCase() === name.toLowerCase());
  }
}
