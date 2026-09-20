import {
  createHyperbitsMcpServer,
  startHyperbitsMcpServer,
} from "../src/mcp/index";

if (process.argv[1]?.endsWith("hyperbits-mcp.ts")) {
  startHyperbitsMcpServer().catch((error) => {
    console.error("Fatal error in hyperbits MCP server:", error);
    process.exit(1);
  });
}

export { createHyperbitsMcpServer, startHyperbitsMcpServer };
