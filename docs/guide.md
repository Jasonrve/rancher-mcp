# Guide

## What this project includes

- TypeScript MCP server for Rancher workflows
- Rancher REST client with caller-aware auth forwarding
- HTTP transport for hosted use
- stdio transport for local agent clients
- Vitest coverage for catalog, auth, executor, and health behavior
- Documentation site with client setup examples

## What problem it solves

If you need Rancher API access from an MCP-compatible agent, this repository gives you a focused server instead of a full operator runtime. That keeps the surface smaller, easier to run, and easier to connect to tools like Claude, Copilot, and Codex.

## Tool families

### Rancher core

These tools cover the day-to-day life cycle of Rancher resources:

- cluster discovery and kubeconfig retrieval
- project lookup, creation, and deletion
- namespace creation, movement, and cleanup

### Access control

These tools help you find principals and attach them to a project:

- principal lookup by name
- project member creation, listing, and deletion

### Fleet

These tools manage GitOps resources and sync state:

- GitRepo listing, creation, update, deletion, pause/resume
- bundle status and sync status lookups
- deployment error inspection

## Local development

```bash
npm install
npm run dev
```

By default the server starts in HTTP mode:

- `PORT=3000`
- `RANCHER_MCP_TRANSPORT=http`
- `RANCHER_MCP_PATH=/mcp`

For stdio-based MCP clients:

```bash
RANCHER_MCP_TRANSPORT=stdio npm run dev
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `RANCHER_URL` | Base Rancher URL |
| `RANCHER_TOKEN` | Fallback bearer token |
| `RANCHER_USERNAME` | Fallback basic-auth username |
| `RANCHER_PASSWORD` | Fallback basic-auth password |
| `RANCHER_MCP_TRANSPORT` | `http` or `stdio` |
| `RANCHER_MCP_PATH` | HTTP route for MCP traffic |
| `PORT` | HTTP listen port |

## Validation

Run the checks before pushing:

```bash
npm test
npm run build
npm run docs:build
```

## Client examples

See [client configuration examples](./clients.md) for Claude Code, Claude CLI, VS Code Copilot, Copilot CLI, Codex, and Codex CLI setup snippets.

## Design notes

- The incoming `Authorization` header is used first.
- If the request has no header, the client falls back to `RANCHER_TOKEN` or `RANCHER_USERNAME` + `RANCHER_PASSWORD`.
- Tool names are kept aligned with the source implementation so existing MCP prompts can migrate without renaming.
