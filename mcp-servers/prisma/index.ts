import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { prisma } from "@/lib/db";

const server = new McpServer({
  name: "prisma-db",
  version: "1.0.0",
});

// Whitelisted models and read-only operations
const MODELS = [
  "opportunity",
  "subcontractor",
  "sow",
  "bid",
  "opportunityProgress",
  "opportunityAssessment",
  "vendor",
  "vendorCommunication",
  "user",
  "systemLog",
  "cronJob",
  "sowApproval",
  "sowVersion",
  "sowActivity",
] as const;

const READ_OPERATIONS = [
  "findFirst",
  "findMany",
  "findUnique",
  "count",
  "aggregate",
  "groupBy",
] as const;

// --- list_opportunities ---
server.tool(
  "list_opportunities",
  "List opportunities with optional filters. Returns id, title, solicitation number, status, NAICS, agency, deadline.",
  {
    status: z.enum(["ACTIVE", "EXPIRED", "AWARDED", "CANCELLED"]).optional().describe("Filter by status"),
    naicsCode: z.string().optional().describe("Filter by NAICS code"),
    agency: z.string().optional().describe("Filter by agency (partial match)"),
    limit: z.number().optional().describe("Max results (default 20)"),
  },
  async (params) => {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.naicsCode) where.naicsCode = params.naicsCode;
    if (params.agency) where.agency = { contains: params.agency, mode: "insensitive" };

    const opportunities = await prisma.opportunity.findMany({
      where,
      take: params.limit || 20,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        solicitationNumber: true,
        title: true,
        status: true,
        naicsCode: true,
        agency: true,
        department: true,
        responseDeadline: true,
        postedDate: true,
        _count: { select: { subcontractors: true, sows: true, bids: true } },
      },
    });

    return {
      content: [{ type: "text" as const, text: JSON.stringify(opportunities, null, 2) }],
    };
  }
);

// --- get_opportunity ---
server.tool(
  "get_opportunity",
  "Get full details for an opportunity by ID or solicitation number. Includes progress, assessment, and related counts.",
  {
    id: z.string().optional().describe("Opportunity ID"),
    solicitationNumber: z.string().optional().describe("SAM.gov solicitation number"),
  },
  async (params) => {
    if (!params.id && !params.solicitationNumber) {
      return {
        content: [{ type: "text" as const, text: "Error: provide either id or solicitationNumber" }],
        isError: true,
      };
    }

    const where = params.id
      ? { id: params.id }
      : { solicitationNumber: params.solicitationNumber! };

    const opp = await prisma.opportunity.findUnique({
      where,
      include: {
        progress: true,
        assessment: true,
        _count: { select: { subcontractors: true, sows: true, bids: true } },
      },
    });

    if (!opp) {
      return {
        content: [{ type: "text" as const, text: "Opportunity not found" }],
      };
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(opp, null, 2) }],
    };
  }
);

// --- list_subcontractors ---
server.tool(
  "list_subcontractors",
  "List subcontractors/vendors for an opportunity with call and quote status.",
  {
    opportunityId: z.string().describe("Opportunity ID"),
  },
  async ({ opportunityId }) => {
    const subs = await prisma.subcontractor.findMany({
      where: { opportunityId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        website: true,
        verificationStatus: true,
        certifications: true,
        ueiNumber: true,
        callCompleted: true,
        callCompletedAt: true,
        quotedAmount: true,
        isActualQuote: true,
        quoteReceivedAt: true,
        source: true,
        location: true,
        naicsCode: true,
      },
    });

    return {
      content: [{ type: "text" as const, text: JSON.stringify(subs, null, 2) }],
    };
  }
);

// --- get_sow ---
server.tool(
  "get_sow",
  "Get Statement of Work content, status, and approvals for an opportunity.",
  {
    opportunityId: z.string().describe("Opportunity ID"),
  },
  async ({ opportunityId }) => {
    const sows = await prisma.sOW.findMany({
      where: { opportunityId },
      orderBy: { version: "desc" },
      include: {
        approvals: { include: { approver: { select: { name: true, email: true } } } },
        generatedBy: { select: { name: true, email: true } },
      },
    });

    if (sows.length === 0) {
      return {
        content: [{ type: "text" as const, text: "No SOWs found for this opportunity" }],
      };
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(sows, null, 2) }],
    };
  }
);

// --- get_bid ---
server.tool(
  "get_bid",
  "Get bid pricing, margins, and quotes for an opportunity.",
  {
    opportunityId: z.string().describe("Opportunity ID"),
  },
  async ({ opportunityId }) => {
    const bids = await prisma.bid.findMany({
      where: { opportunityId },
      orderBy: { createdAt: "desc" },
    });

    if (bids.length === 0) {
      return {
        content: [{ type: "text" as const, text: "No bids found for this opportunity" }],
      };
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(bids, null, 2) }],
    };
  }
);

// --- get_progress ---
server.tool(
  "get_progress",
  "Get workflow progress including stage, blockers, and next actions for an opportunity.",
  {
    opportunityId: z.string().describe("Opportunity ID"),
  },
  async ({ opportunityId }) => {
    const progress = await prisma.opportunityProgress.findUnique({
      where: { opportunityId },
    });

    if (!progress) {
      return {
        content: [{ type: "text" as const, text: "No progress record found for this opportunity" }],
      };
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(progress, null, 2) }],
    };
  }
);

// --- query (generic read-only) ---
server.tool(
  "query",
  "Generic read-only Prisma query. Supports any model with findFirst, findMany, findUnique, count, aggregate, or groupBy. No writes allowed.",
  {
    model: z.enum(MODELS).describe("Prisma model name (camelCase)"),
    operation: z.enum(READ_OPERATIONS).describe("Read-only operation"),
    args: z.record(z.string(), z.any()).optional().describe("Prisma query args (where, select, include, take, skip, orderBy, etc.)"),
  },
  async (params) => {
    const delegate = (prisma as any)[params.model];
    if (!delegate) {
      return {
        content: [{ type: "text" as const, text: `Error: unknown model "${params.model}"` }],
        isError: true,
      };
    }

    const operation = delegate[params.operation];
    if (typeof operation !== "function") {
      return {
        content: [{ type: "text" as const, text: `Error: operation "${params.operation}" not available on model "${params.model}"` }],
        isError: true,
      };
    }

    try {
      const result = await operation.call(delegate, params.args || {});
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text" as const, text: `Query error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// --- Start server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Prisma DB MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting Prisma MCP server:", err);
  process.exit(1);
});
