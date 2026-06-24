# Guide

## What is included

- TypeScript MCP server
- Rancher REST client
- pass-through `Authorization` handling
- stdio transport for local MCP clients
- HTTP transport for remote/hosted use
- VitePress docs for GitHub Pages
- Vitest coverage for catalog, auth, executor, and HTTP health behavior

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
