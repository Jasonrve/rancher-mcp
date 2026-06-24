# rancher-mcp

A TypeScript MCP server for Rancher workflows.

## What it does

- exposes the Rancher MCP tool catalog
- forwards the incoming `Authorization` header to Rancher
- falls back to configured Rancher credentials when no header is present
- supports HTTP and stdio transports
- includes Vitest coverage
- ships VitePress docs for GitHub Pages

## Quick start

```bash
npm install
npm test
npm run build
npm run dev
```

## Environment

| Variable | Purpose |
| --- | --- |
| `RANCHER_URL` | Base Rancher URL |
| `RANCHER_TOKEN` | Fallback bearer token |
| `RANCHER_USERNAME` | Fallback basic-auth username |
| `RANCHER_PASSWORD` | Fallback basic-auth password |
| `RANCHER_MCP_TRANSPORT` | `http` or `stdio` |
| `RANCHER_MCP_PATH` | HTTP route for MCP traffic |
| `PORT` | HTTP listen port |

## Development commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the server |
| `npm run test` | Run Vitest |
| `npm run build` | Compile TypeScript |
| `npm run docs:dev` | Start the docs site |
| `npm run docs:build` | Build the docs site |

## Docs

The site is under `docs/` and is configured for GitHub Pages with the repo slug base path.

- [Guide](./docs/guide.md)
- [Client configuration examples](./docs/clients.md)
- [API reference](./docs/api.md)

## Source project

This repo mirrors the Rancher-side MCP surface from the original C# implementation.
