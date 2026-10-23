# Product feedback

Feedback on the tools Guardian was built with during the "Build, Ship, Shape" hackathon (Alexa+ track).
Numbered references (#N) point to entries in [`friction-log.md`](friction-log.md).

## MCP TypeScript SDK v2 (`@modelcontextprotocol/server`, `/client`, `/node`, `/express`)

**Used for:** the Guardian MCP server (6 tools, stateless Streamable HTTP at `POST /mcp`) and the simulator's MCP
client.

**What worked**
- Stateless mode (`sessionIdGenerator: undefined`, a new server and transport per request) made the server easy to
  deploy on a free host that restarts often. There's no session to lose.
- `registerTool` with zod v4 `inputSchema`/`outputSchema` gave typed handlers, plus validation on both ends without
  extra code.
- `client.getNegotiatedProtocolVersion()` let us assert in a test that the server negotiates 2025-11-25.

**What needs work**
- Supported protocol versions aren't documented in the package READMEs. We had to search the bundled code to find
  them (#3). Exporting a `SUPPORTED_PROTOCOL_VERSIONS` constant would fix this.
- The client caches output schemas from `listTools()`. After an additive schema change on a redeployed server,
  every call from a connected client failed validation, and stateless servers can't send `list_changed` (#8).
- Moving from v1 tutorials is mostly smooth, but the raw-zod-shape deprecation only shows as an editor strikethrough (#2).
- For public deploys, `allowedHosts` applies to every route, and the 0.0.0.0 warning still prints when the MCP
  route is protected separately (#10).

**Would we build with it again?** Yes.

## MCP Apps (`@modelcontextprotocol/ext-apps`)

**Used for:** two `ui://` cards (risk score and family verification), rendered in the simulator through
`app-bridge`.

**What worked**
- `registerAppTool` + `_meta.ui.resourceUri` is a clean way to attach a UI to a tool result, and the same tool
  still works as plain text in hosts without UI support.
- `ontoolinput` / `ontoolresult` in the View made the cards simple: render from `structuredContent`.

**What needs work**
- No single-file/IIFE build of the `App` class, so each card is bundled with esbuild at server start (#6). A helper
  that turns a View entry file into ready-to-serve HTML would remove most of the setup.
- The marketplace name in the plugin install instructions is wrong (#1).

## Alexa+ developer experience

**What we wanted:** to connect Guardian's MCP server to Alexa+ on a real Echo Show.

**What happened:** we couldn't find a way for an individual developer to connect a self-hosted MCP server to Alexa+
on a device during the hackathon. So we built a browser simulator (Web Speech API + an LLM agent acting as Alexa) and
kept the MCP server host-agnostic.

**Feature requests**
- An Alexa+ MCP sandbox for individual developers: register a Streamable HTTP endpoint, test on your own device.
- MCP Apps rendering on Echo Show, so `ui://` cards appear on the screen next to the spoken reply.
- Strong Hindi and Hinglish speech in the developer test tools, including code-mixed input.
- A "quiet response" mode an integration can request: show text without speaking, for users who can't safely talk
  out loud.

## Hosting: Render (free tier)

**Used for:** two web services (MCP server + dashboard, simulator) from one `render.yaml` Blueprint.

**What worked:** Blueprint deploys from the repo, automatic HTTPS, and `RENDER_EXTERNAL_HOSTNAME`, which we use for
the MCP host allow-list.

**What needs work:** the service URL silently gets a suffix when the name is taken, and nothing in the Blueprint
flow says so (#9). Cold starts of up to a minute on the free tier make live demos risky.

## Gemini API (simulator's "Alexa" agent)

**Used for:** the LLM that decides when to call Guardian's tools, via function calling.

**What worked:** in our runs, `gemini-flash-lite-latest` followed the server's MCP `instructions` and called the tools
in the intended order for Hinglish input. It sometimes picked the wrong locale (en-IN instead of en-US) or replied
in romanized Hindi.

**What needs work:** the free-tier limit for `gemini-flash-latest` (5 requests per minute) is too low for an agent
loop. One turn uses about 6 calls. The retry delay is only given inside the error message text (#7).

## MCP Inspector

**Used for:** checking the deployed server's tools and protocol version by hand.

**What needs work:** the 2.x README doesn't document how to open the Inspector already pointed at a URL (#4).
