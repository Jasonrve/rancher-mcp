# API

## Tool catalog

The catalog intentionally matches the Rancher-only MCP surface from `rancher-devops-operator`.

### Rancher tools

- `cluster_list`
- `cluster_get_id`
- `cluster_get_kubeconfig`
- `project_list`
- `project_get`
- `project_create`
- `project_delete`
- `namespace_create`
- `namespace_get`
- `namespace_update_project`
- `namespace_remove_project`
- `namespace_list_by_project`
- `namespace_delete`
- `namespace_ensure_managed_by`
- `project_member_create`
- `project_member_list`
- `project_member_delete`
- `principal_get_by_name`

### Fleet tools

- `list_fleet_gitrepos`
- `get_fleet_gitrepo`
- `list_fleet_bundles`
- `get_fleet_bundle_status`
- `get_fleet_sync_status`
- `get_fleet_deployment_errors`
- `create_fleet_gitrepo`
- `update_fleet_gitrepo`
- `delete_fleet_gitrepo`
- `force_fleet_sync`
- `pause_fleet_gitrepo`
- `resume_fleet_gitrepo`

## Behavior

- `tools/list` exposes only the catalog above.
- `tools/call` dispatches to the Rancher client.
- Authorization is inherited from the active request context.
- Responses are returned as JSON text content to keep the MCP surface simple.
