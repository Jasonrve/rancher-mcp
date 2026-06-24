# rancher-mcp

<p align="center">
  <img src="./docs/logo.svg" alt="rancher-mcp logo" width="180" />
</p>

<p align="center">
  <a href="https://github.com/Jasonrve/rancher-mcp/actions/workflows/ci.yml">
    <img src="https://github.com/Jasonrve/rancher-mcp/actions/workflows/ci.yml/badge.svg" alt="CI status" />
  </a>
  <a href="https://github.com/Jasonrve/rancher-mcp/actions/workflows/pages.yml">
    <img src="https://github.com/Jasonrve/rancher-mcp/actions/workflows/pages.yml/badge.svg" alt="GitHub Pages status" />
  </a>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license" />
  <img src="https://img.shields.io/badge/Node-%3E=22-339933.svg" alt="Node 22+" />
</p>

A polished TypeScript MCP server for Rancher workflows.

It exposes the Rancher tool surface as a standalone MCP service, forwards caller identity when available, and falls back to configured Rancher credentials when needed. The repo includes tests, a documentation site, and GitHub Pages publishing.

## Why this exists

Rancher users often need the tool surface without the surrounding operator/runtime package. `rancher-mcp` keeps the useful Rancher and Fleet actions, but packages them as a focused MCP server that is easier to run locally, automate, and connect to agent clients.

## What it does

- exposes Rancher cluster, project, namespace, access-control, and Fleet tools
- supports HTTP and stdio transports
- forwards the incoming `Authorization` header to Rancher
- falls back to configured Rancher credentials when no header is present
- includes Vitest coverage for the tool catalog, auth, executor, and health route
- ships a documentation site with client setup examples

## Tool groups

| Group | Examples | What it is for |
| --- | --- | --- |
| Rancher core | `cluster_list`, `project_create`, `namespace_create` | Everyday cluster, project, and namespace workflows |
| Access control | `project_member_create`, `principal_get_by_name` | Finding principals and binding them to projects |
| Fleet | `create_fleet_gitrepo`, `update_fleet_gitrepo`, `force_fleet_sync` | GitOps repo and sync management |

## Quick start

```bash
npm install
npm test
npm run build
npm run dev
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

## Client examples and docs

- [Documentation landing page](./docs/index.md)
- [Guide](./docs/guide.md)
- [Client configuration examples](./docs/clients.md)
- [API reference](./docs/api.md)

## Development commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the server |
| `npm run test` | Run Vitest |
| `npm run build` | Compile TypeScript |
| `npm run docs:dev` | Start the docs site |
| `npm run docs:build` | Build the docs site |
| `npm run docs:preview` | Preview the docs site |

## Project layout

```text
.
├── src/
├── tests/
├── docs/
├── dist/
├── package.json
└── README.md
```

## Source project

This repository mirrors the Rancher-side MCP surface from the original C# implementation.
