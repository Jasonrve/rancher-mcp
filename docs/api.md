# API

## Tool catalog

The catalog is grouped by Rancher workflow so the surface is easier to scan and reason about.

### Rancher core

These tools cover cluster, project, and namespace operations.

- `cluster_list` — list Rancher clusters
- `cluster_get_id` — resolve a cluster name to a cluster ID
- `cluster_get_kubeconfig` — fetch a cluster kubeconfig
- `project_list` — list Rancher projects
- `project_get` — get a project by cluster and name
- `project_create` — create a project
- `project_delete` — delete a project
- `namespace_create` — create a namespace in a project
- `namespace_get` — get a namespace by cluster and name
- `namespace_update_project` — move a namespace to another project
- `namespace_remove_project` — remove a namespace from a project
- `namespace_list_by_project` — list namespaces in a project
- `namespace_delete` — delete a namespace
- `namespace_ensure_managed_by` — stamp or normalize Rancher-managed labels and annotations

### Access control

These tools help with principals and project bindings.

- `project_member_create` — bind a principal to a project role
- `project_member_list` — list project member bindings
- `project_member_delete` — remove a project member binding
- `principal_get_by_name` — resolve a principal by name

### Fleet

These tools cover GitOps repo management and sync visibility.

- `list_fleet_gitrepos` — list Fleet GitRepos
- `get_fleet_gitrepo` — get a Fleet GitRepo by id or name
- `list_fleet_bundles` — list Fleet bundles
- `get_fleet_bundle_status` — get a Fleet bundle status
- `get_fleet_sync_status` — get Fleet sync state
- `get_fleet_deployment_errors` — inspect Fleet deployment errors
- `create_fleet_gitrepo` — create a Fleet GitRepo
- `update_fleet_gitrepo` — update a Fleet GitRepo
- `delete_fleet_gitrepo` — delete a Fleet GitRepo
- `force_fleet_sync` — force a Fleet sync
- `pause_fleet_gitrepo` — pause a Fleet GitRepo
- `resume_fleet_gitrepo` — resume a Fleet GitRepo

## Behavior

- `tools/list` exposes only the catalog above.
- `tools/call` dispatches to the Rancher client.
- Authorization is inherited from the active request context.
- Responses are returned as JSON text content to keep the MCP surface simple.
