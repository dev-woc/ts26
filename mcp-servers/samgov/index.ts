import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  fetchOpportunityFromSam,
  getOpportunityAttachments,
  getSamGovUrl,
  searchSamEntities,
} from "@/lib/samgov";

const server = new McpServer({
  name: "samgov",
  version: "1.0.0",
});

// --- search_opportunities ---
server.tool(
  "search_opportunities",
  "Search SAM.gov by solicitation number. Returns title, description, and attachments.",
  { solicitationNumber: z.string().describe("SAM.gov solicitation number (e.g. W912DY-25-R-0001)") },
  async ({ solicitationNumber }) => {
    const result = await fetchOpportunityFromSam(solicitationNumber);
    if (!result) {
      return {
        content: [{ type: "text" as const, text: `No opportunity found for solicitation number: ${solicitationNumber}` }],
      };
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  }
);

// --- search_entities ---
server.tool(
  "search_entities",
  "Search SAM.gov entity registry for vendors by NAICS code, state, business name, or UEI number. Returns vendor data and certifications.",
  {
    naicsCode: z.string().optional().describe("NAICS code to filter by"),
    stateCode: z.string().optional().describe("Two-letter state code (e.g. VA, CA)"),
    legalBusinessName: z.string().optional().describe("Business name to search for"),
    ueiNumber: z.string().optional().describe("Unique Entity Identifier"),
    pageSize: z.number().optional().describe("Number of results (default 10, max 100)"),
  },
  async (params) => {
    const result = await searchSamEntities({
      naicsCode: params.naicsCode,
      stateCode: params.stateCode,
      legalBusinessName: params.legalBusinessName,
      ueiNumber: params.ueiNumber,
      pageSize: params.pageSize,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  }
);

// --- get_attachments ---
server.tool(
  "get_attachments",
  "Get document attachments for a SAM.gov solicitation.",
  { solicitationNumber: z.string().describe("SAM.gov solicitation number") },
  async ({ solicitationNumber }) => {
    const attachments = await getOpportunityAttachments(solicitationNumber);
    if (attachments.length === 0) {
      return {
        content: [{ type: "text" as const, text: `No attachments found for: ${solicitationNumber}` }],
      };
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify(attachments, null, 2) }],
    };
  }
);

// --- get_opportunity_url ---
server.tool(
  "get_opportunity_url",
  "Get the public SAM.gov URL for a solicitation.",
  { solicitationNumber: z.string().describe("SAM.gov solicitation number") },
  async ({ solicitationNumber }) => {
    const url = getSamGovUrl(solicitationNumber);
    return {
      content: [{ type: "text" as const, text: url }],
    };
  }
);

// --- Start server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SAM.gov MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting SAM.gov MCP server:", err);
  process.exit(1);
});
