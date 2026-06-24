---
layout: home
hero:
  name: rancher-mcp
  text: Rancher tools, without the operator runtime
  tagline: TypeScript MCP server with pass-through auth, tests, and GitHub Pages docs.
  actions:
    - theme: brand
      text: Read the guide
      link: /guide
    - theme: alt
      text: API reference
      link: /api
features:
  - title: Rancher-only surface
    details: Ports the MCP tool catalog from rancher-devops-operator without the Kubernetes operator.
  - title: Pass-through authorization
    details: Incoming Authorization headers are forwarded to Rancher before falling back to configured credentials.
  - title: VitePress docs
    details: GitHub Pages-ready documentation with a deployment workflow.
---

## What this repo is

`rancher-mcp` is a TypeScript MCP server for Rancher workflows. It mirrors the Rancher-side MCP tools from `rancher-devops-operator`, but drops the operator/Kubernetes runtime and keeps the implementation focused on MCP + Rancher API calls.

Use the guide for local development and the API page for the tool inventory.
