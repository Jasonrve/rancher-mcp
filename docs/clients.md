# Client configuration examples

Use the same MCP server definition everywhere; only the client wrapper changes.

## Quick recommendation

| Client | Best transport | Why |
| --- | --- | --- |
| Claude Code | stdio | It can launch the server locally for you |
| Claude CLI | stdio | Simple local process integration |
| VS Code Copilot | HTTP | Easy to connect to a running server |
| Copilot CLI | stdio | Works well with a launched process |
| Codex | HTTP or stdio | Choose whichever matches your workflow |
| Codex CLI | stdio | Best fit for local process launch |

## Shared server definitions

### HTTP transport

```json
{
  "mcpServers": {
    "rancher-mcp": {
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

### stdio transport

```json
{
  "mcpServers": {
    "rancher-mcp": {
      "command": "npm",
      "args": ["run", "dev"],
      "env": {
        "RANCHER_MCP_TRANSPORT": "stdio",
        "RANCHER_URL": "https://rancher.example.com",
        "RANCHER_TOKEN": "replace-me"
      }
    }
  }
}
```

## Claude Code

Claude Code is usually easiest to configure with the stdio form so it launches the local server itself.

```json
{
  "mcpServers": {
    "rancher-mcp": {
      "command": "npm",
      "args": ["run", "dev"],
      "env": {
        "RANCHER_MCP_TRANSPORT": "stdio",
        "RANCHER_URL": "https://rancher.example.com"
      }
    }
  }
}
```

## Claude CLI

Use the same stdio form in the Claude CLI MCP configuration.

```json
{
  "mcpServers": {
    "rancher-mcp": {
      "command": "npm",
      "args": ["run", "dev"],
      "env": {
        "RANCHER_MCP_TRANSPORT": "stdio",
        "RANCHER_URL": "https://rancher.example.com"
      }
    }
  }
}
```

## VS Code Copilot

VS Code Copilot is a good fit for the HTTP form because the editor can connect directly to the running server.

```json
{
  "mcpServers": {
    "rancher-mcp": {
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

## Copilot CLI

Use the stdio form in the Copilot CLI MCP configuration.

```json
{
  "mcpServers": {
    "rancher-mcp": {
      "command": "npm",
      "args": ["run", "dev"],
      "env": {
        "RANCHER_MCP_TRANSPORT": "stdio",
        "RANCHER_URL": "https://rancher.example.com"
      }
    }
  }
}
```

## Codex

Codex can use the HTTP form when the server is already running, or the stdio form when you want Codex to launch it locally.

```json
{
  "mcpServers": {
    "rancher-mcp": {
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

## Codex CLI

Use the stdio form in the Codex CLI MCP configuration.

```json
{
  "mcpServers": {
    "rancher-mcp": {
      "command": "npm",
      "args": ["run", "dev"],
      "env": {
        "RANCHER_MCP_TRANSPORT": "stdio",
        "RANCHER_URL": "https://rancher.example.com"
      }
    }
  }
}
```
