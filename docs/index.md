---
layout: home
hero:
  name: rancher-mcp
  text: Rancher tools, without the Kubernetes runtime
  tagline: TypeScript MCP server with pass-through auth, tests, and GitHub Pages docs.
  actions:
    - theme: brand
      text: Read the guide
      link: /guide
    - theme: alt
      text: Client examples
      link: /clients
features:
  - title: Rancher-only surface
    details: Ports the MCP tool catalog into a standalone TypeScript server.
  - title: Pass-through authorization
    details: Incoming Authorization headers are forwarded to Rancher before falling back to configured credentials.
  - title: VitePress docs
    details: GitHub Pages-ready documentation with a deployment workflow.
---

## What this repo is

`rancher-mcp` is a TypeScript MCP server for Rancher workflows. It focuses on MCP + Rancher API calls and leaves out the surrounding Kubernetes runtime.

Use the guide for local development, the client examples for Claude/Copilot/Codex setup, and the API page for the tool inventory.
