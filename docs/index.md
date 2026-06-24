---
layout: home
hero:
  name: rancher-mcp
  text: Rancher tooling as a standalone MCP server
  tagline: A focused TypeScript MCP service for Rancher cluster, project, namespace, access-control, and Fleet workflows.
  image:
    src: /logo.svg
    alt: rancher-mcp logo
  actions:
    - theme: brand
      text: Read the guide
      link: /guide
    - theme: alt
      text: Client examples
      link: /clients
features:
  - title: Rancher workflows
    details: Cluster, project, namespace, principal, and Fleet operations are exposed through the MCP surface.
  - title: Identity-aware transport
    details: Caller Authorization headers are forwarded first, then Rancher credentials are used as a fallback.
  - title: Built for agents
    details: The docs include practical examples for Claude, Copilot, and Codex clients.
---

![rancher-mcp logo](./logo.svg)

## What this project is for

`rancher-mcp` packages the Rancher-side MCP tool surface as a standalone service. It is designed for agentic workflows that need to create or inspect Rancher resources, manage Fleet GitRepos, and connect to Rancher with the caller’s identity when available.

## How the tooling is grouped

| Group | What it covers | Typical use |
| --- | --- | --- |
| Rancher core | clusters, projects, namespaces | Provisioning and cleanup |
| Access control | principals, project members | Finding users/groups and binding access |
| Fleet | GitRepos, bundles, sync and error inspection | GitOps workflows |

## Start here

- [Guide](./guide.md) for setup and validation
- [Client examples](./clients.md) for Claude, Copilot, and Codex configuration
- [API reference](./api.md) for the complete tool inventory
