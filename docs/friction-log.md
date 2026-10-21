# Friction log

| # | Task | Steps | Expected | Actual | Severity | Workaround | Suggestion |
|---|------|-------|----------|--------|----------|------------|------------|
| 1 | Install MCP Apps Claude Code plugin | `/plugin marketplace add modelcontextprotocol/ext-apps`, then `/plugin install mcp-apps@modelcontextprotocol-ext-apps` | Install succeeds using the `<owner>-<repo>` marketplace name | `Marketplace "modelcontextprotocol-ext-apps" not found`; the marketplace registers under the name in its manifest (`mcp-apps`), not the repo path | Low | `/plugin install mcp-apps@mcp-apps` | Have `marketplace add` print the exact install command, and use the registered marketplace name in the ext-apps README instructions |
