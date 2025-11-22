/**
 * Database Query Tool for Support Agent
 *
 * This tool allows the AI agent to query the Neon PostgreSQL database
 * and the knowledge base in parallel, with strict priority rules:
 * - Database is always queried first and takes priority
 * - If database has results, knowledge base is ignored
 * - If database is empty, knowledge base is used as fallback
 */

import { createTool } from "@convex-dev/agent";
import z from "zod";
import { internal } from "../../../_generated/api";
import { queryOrders, queryUserTickets, searchRecords } from "../../../db/queries";
import { QueryResult } from "../../../db/types";
import { executeOrgQuery } from "../../../db/neonConnection";
import rag from "../rag";
import { supportAgent } from "../agents/supportAgent";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { SEARCH_INTERPRETER_PROMPT } from "../constants";

/**
 * Output format for database query results (internal typing only)
 */
type QueryType =
  | "tickets"
  | "orders"
  | "search"
  | "doctors"
  | "patients"
  | "appointments"
  | "medications"
  | "lab_results"
  | "medical_records";

export interface DatabaseQueryToolResult {
  source: "database" | "knowledge_base" | "none" | "both";
  summary: string;
  records: any[];
  metadata: {
    queryType: QueryType;
    rowCount: number;
  };
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return "N/A";
  }

  if (Array.isArray(value)) {
    return value.map((v) => String(v)).join(", ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function toTitleCaseKey(key: string): string {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatStructuredRecords(
  entityLabel: string,
  rows: any[],
  maxItems = 20,
): string {
  if (!rows.length) {
    return `No ${entityLabel.toLowerCase()} records found in the database.`;
  }

  const items = rows.slice(0, maxItems);
  const sections = items.map((row, index) => {
    const lines = Object.entries(row).map(([key, value]) => {
      const title = toTitleCaseKey(key);
      return `- **${title}:** ${formatValue(value)}`;
    });

    const headerLabel = `${entityLabel} ${index + 1}`;
    return `${index + 1}. **${headerLabel}**\n${lines.join("\n")}`;
  });

  const truncatedNote =
    rows.length > maxItems
      ? `\n\n(Showing first ${maxItems} of ${rows.length} record(s).)`
      : "";

  return (
    `Found ${rows.length} ${entityLabel.toLowerCase()} record(s) in the database (up to the current limit).` +
    "\n\n" +
    sections.join("\n\n") +
    truncatedNote
  );
}

/**
 * Heuristic to decide which query to run based on natural language.
 */
function inferQueryType(question: string): QueryType {
  const q = question.toLowerCase();

  if (q.includes("doctor") || q.includes("physician")) {
    return "doctors";
  }

  if (q.includes("patient")) {
    return "patients";
  }

  if (
    q.includes("appointment") ||
    q.includes("schedule") ||
    q.includes("slot")
  ) {
    return "appointments";
  }

  if (
    q.includes("medication") ||
    q.includes("medicine") ||
    q.includes("drug")
  ) {
    return "medications";
  }

  if (
    q.includes("lab result") ||
    q.includes("test result") ||
    q.includes("lab test")
  ) {
    return "lab_results";
  }

  if (
    q.includes("medical record") ||
    (q.includes("record") && q.includes("medical"))
  ) {
    return "medical_records";
  }

  if (
    q.includes("ticket") ||
    q.includes("support case") ||
    q.includes("support request")
  ) {
    return "tickets";
  }

  if (
    q.includes("order") ||
    q.includes("purchase") ||
    q.includes("invoice")
  ) {
    return "orders";
  }

  return "search";
}

/**
 * Format a final answer string from chosen data source(s).
 */
function formatAnswer(
  queryType: QueryType,
  dbResult: QueryResult<any> | null,
  kbText: string | null
): DatabaseQueryToolResult {
  // Database has priority if it has any rows
  if (dbResult && dbResult.rowCount > 0) {
    if (queryType === "doctors") {
      return {
        source: "database",
        summary: formatStructuredRecords("Doctor", dbResult.rows),
        records: dbResult.rows,
        metadata: { queryType, rowCount: dbResult.rowCount },
      };
    }

    if (queryType === "patients") {
      return {
        source: "database",
        summary: formatStructuredRecords("Patient", dbResult.rows),
        records: dbResult.rows,
        metadata: { queryType, rowCount: dbResult.rowCount },
      };
    }

    if (queryType === "appointments") {
      return {
        source: "database",
        summary: formatStructuredRecords("Appointment", dbResult.rows),
        records: dbResult.rows,
        metadata: { queryType, rowCount: dbResult.rowCount },
      };
    }

    if (queryType === "medications") {
      return {
        source: "database",
        summary: formatStructuredRecords("Medication", dbResult.rows),
        records: dbResult.rows,
        metadata: { queryType, rowCount: dbResult.rowCount },
      };
    }

    if (queryType === "lab_results") {
      return {
        source: "database",
        summary: formatStructuredRecords("Lab Result", dbResult.rows),
        records: dbResult.rows,
        metadata: { queryType, rowCount: dbResult.rowCount },
      };
    }

    if (queryType === "medical_records") {
      return {
        source: "database",
        summary: formatStructuredRecords("Medical Record", dbResult.rows),
        records: dbResult.rows,
        metadata: { queryType, rowCount: dbResult.rowCount },
      };
    }

    if (queryType === "tickets") {
      const tickets = dbResult.rows.slice(0, 5);
      const lines = tickets.map((t: any) => `#${t.id}: ${t.title} (${t.status})`);
      return {
        source: "database",
        summary: `Found ${dbResult.rowCount} ticket(s) in the database. Recent tickets:\n` +
          lines.join("\n"),
        records: dbResult.rows,
        metadata: { queryType, rowCount: dbResult.rowCount },
      };
    }

    if (queryType === "orders") {
      const orders = dbResult.rows.slice(0, 5);
      const lines = orders.map(
        (o: any) => `${o.order_number}: ${o.status} - ${o.total_amount} ${o.currency}`,
      );
      return {
        source: "database",
        summary: `Found ${dbResult.rowCount} order(s) in the database. Recent orders:\n` +
          lines.join("\n"),
        records: dbResult.rows,
        metadata: { queryType, rowCount: dbResult.rowCount },
      };
    }

    // Generic DB search
    if (queryType === "search" && dbResult.rows.length > 0) {
      const first = dbResult.rows[0] as any;
      if (first && Object.prototype.hasOwnProperty.call(first, "record_type")) {
        const items = dbResult.rows.slice(0, 5);
        const lines = items.map(
          (r: any) => `${r.record_type}: ${r.title ?? r.id}`,
        );
        return {
          source: "database",
          summary:
            `Found ${dbResult.rowCount} record(s) in the database. Sample:\n` +
            lines.join("\n"),
          records: dbResult.rows,
          metadata: { queryType, rowCount: dbResult.rowCount },
        };
      }

      return {
        source: "database",
        summary: formatStructuredRecords("Record", dbResult.rows),
        records: dbResult.rows,
        metadata: { queryType, rowCount: dbResult.rowCount },
      };
    }

    const items = dbResult.rows.slice(0, 5);
    const lines = items.map((r: any) => `${r.record_type}: ${r.title ?? r.id}`);
    return {
      source: "database",
      summary:
        `Found ${dbResult.rowCount} record(s) in the database. Sample:\n` +
        lines.join("\n"),
      records: dbResult.rows,
      metadata: { queryType, rowCount: dbResult.rowCount },
    };
  }

  // Database empty → fallback to knowledge base text if available
  if (kbText && kbText.trim().length > 0) {
    return {
      source: "knowledge_base",
      summary: kbText,
      records: [],
      metadata: { queryType, rowCount: 0 },
    };
  }

  // Both empty
  return {
    source: "none",
    summary:
      "I couldn't find any matching information in either the database or the knowledge base for this question.",
    records: [],
    metadata: { queryType, rowCount: 0 },
  };
}

async function queryTable(
  tableName: string,
  organizationId: string,
  limit: number,
  offset: number = 0,
): Promise<QueryResult<any>> {
  const sql = `SELECT * FROM ${tableName} ORDER BY 1 LIMIT $1 OFFSET $2`;
  const result = await executeOrgQuery<any>(organizationId, sql, [limit, offset]);

  return {
    rows: result.rows,
    rowCount: result.rowCount,
  };
}

async function queryDoctors(
  organizationId: string,
  limit: number,
  offset: number = 0,
): Promise<QueryResult<any>> {
  return queryTable("doctors", organizationId, limit, offset);
}

async function queryPatients(
  organizationId: string,
  limit: number,
  offset: number = 0,
): Promise<QueryResult<any>> {
  return queryTable("patients", organizationId, limit, offset);
}

async function queryAppointments(
  organizationId: string,
  limit: number,
  offset: number = 0,
): Promise<QueryResult<any>> {
  return queryTable("appointments", organizationId, limit, offset);
}

async function queryMedications(
  organizationId: string,
  limit: number,
  offset: number = 0,
): Promise<QueryResult<any>> {
  return queryTable("medications", organizationId, limit, offset);
}

async function queryLabResults(
  organizationId: string,
  limit: number,
  offset: number = 0,
): Promise<QueryResult<any>> {
  return queryTable("lab_results", organizationId, limit, offset);
}

async function queryMedicalRecords(
  organizationId: string,
  limit: number,
  offset: number = 0,
): Promise<QueryResult<any>> {
  return queryTable("medical_records", organizationId, limit, offset);
}

async function listPublicTables(organizationId: string): Promise<string[]> {
  const result = await executeOrgQuery<{ table_name: string }>(
    organizationId,
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `,
    [],
  );

  return result.rows.map(
    (row) => (row as any).table_name as string,
  );
}

function normalizeTableName(name: string): string {
  return name.toLowerCase().replace(/_/g, " ");
}

function computeTableMatchScore(
  tableName: string,
  question: string,
): number {
  const q = question.toLowerCase();
  const normTable = normalizeTableName(tableName);

  let score = 0;

  if (q.includes(normTable)) {
    score += 5;
  }

  if (q.includes(tableName.toLowerCase())) {
    score += 2;
  }

  const qTokens = q.split(/\W+/).filter(Boolean);
  const tableTokens = normTable.split(/\W+/).filter(Boolean);

  let overlap = 0;
  for (const token of tableTokens) {
    if (qTokens.includes(token)) {
      overlap += 1;
    }
  }

  score += overlap;

  return score;
}

async function findBestMatchingTable(
  question: string,
  organizationId: string,
): Promise<string | null> {
  const tables = await listPublicTables(organizationId);

  let bestName: string | null = null;
  let bestScore = 0;

  for (const name of tables) {
    const score = computeTableMatchScore(name, question);
    if (score > bestScore) {
      bestScore = score;
      bestName = name;
    }
  }

  return bestScore > 0 ? bestName : null;
}

/**
 * Database + Knowledge Base query tool.
 *
 * This tool is intended to be called by the agent for questions about
 * user-specific data (tickets, orders, accounts, etc.).
 */
export const databaseQueryTool = createTool({
  description:
    "Query the PostgreSQL database for user- and organization-specific data (such as doctors, patients, appointments, medications, lab results, medical records), with knowledge base fallback.",
  args: z.object({
    query: z
      .string()
      .describe(
        "Natural language question to answer using the database, with knowledge base as fallback.",
      ),
    page: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe("Page number for paginated database results (1-based)."),
    pageSize: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Number of records per page for database listings (max 100)."),
  }),
  handler: async (ctx, args): Promise<string> => {
    if (!ctx.threadId) {
      return "Missing thread ID";
    }

    // Fetch conversation to determine organization and user context
    const conversation = await ctx.runQuery(
      internal.system.conversations.getByThreadId,
      { threadId: ctx.threadId },
    );

    if (!conversation) {
      return "Conversation not found";
    }

    const contactSession = await ctx.runQuery(
      internal.system.contactSessions.getOne,
      { contactSessionId: conversation.contactSessionId },
    );

    const organizationId: string = conversation.organizationId;
    const userId: string | undefined = contactSession?.email ?? undefined;

    const queryType = inferQueryType(args.query);

    const page = args.page && args.page > 0 ? args.page : 1;
    const pageSize =
      args.pageSize && args.pageSize > 0
        ? Math.min(args.pageSize, 100)
        : 20;
    const offset = (page - 1) * pageSize;

    // Query database and knowledge base in parallel
    let dbResult: QueryResult<any> | null = null;
    let kbText: string | null = null;

    try {
      const [db, kb] = await Promise.all([
        (async () => {
          try {
            if (queryType === "tickets" && userId) {
              return await queryUserTickets(userId, organizationId);
            }
            if (queryType === "orders" && userId) {
              return await queryOrders(userId, organizationId);
            }
            if (queryType === "doctors") {
              return await queryDoctors(organizationId, pageSize, offset);
            }
            if (queryType === "patients") {
              return await queryPatients(organizationId, pageSize, offset);
            }
            if (queryType === "appointments") {
              return await queryAppointments(organizationId, pageSize, offset);
            }
            if (queryType === "medications") {
              return await queryMedications(organizationId, pageSize, offset);
            }
            if (queryType === "lab_results") {
              return await queryLabResults(organizationId, pageSize, offset);
            }
            if (queryType === "medical_records") {
              return await queryMedicalRecords(organizationId, pageSize, offset);
            }
            if (queryType === "search") {
              const tableName = await findBestMatchingTable(args.query, organizationId);
              if (tableName) {
                return await queryTable(tableName, organizationId, pageSize, offset);
              }
            }
            return await searchRecords(args.query, organizationId, { 
              limit: pageSize, 
              offset: offset 
            });
          } catch (error) {
            console.error("[DatabaseQueryTool] Database query failed", error);
            return null;
          }
        })(),
        (async () => {
          try {
            const primaryNamespace = organizationId;
            const fallbackNamespace = "global";

            let searchResult = await rag.search(ctx, {
              namespace: primaryNamespace,
              query: args.query,
              limit: 5,
            });

            if (!searchResult.text || searchResult.text.trim().length === 0) {
              const globalResult = await rag.search(ctx, {
                namespace: fallbackNamespace,
                query: args.query,
                limit: 5,
              });

              if (!globalResult.text || globalResult.text.trim().length === 0) {
                return null;
              }

              searchResult = globalResult;
            }

            // Build a concise context string similar to the existing search tool
            const contextText = `Found results in ${searchResult.entries
              .map((e) => e.title || null)
              .filter((t) => t !== null)
              .join(", ")}. Here is the context:\n\n${searchResult.text}`;

            return contextText;
          } catch (error) {
            console.error("[DatabaseQueryTool] Knowledge base search failed", error);
            return null;
          }
        })(),
      ]);

      dbResult = db;
      kbText = kb;
    } catch (error) {
      console.error("[DatabaseQueryTool] Error running parallel queries", error);
    }

    let finalResult = formatAnswer(queryType, dbResult, kbText);

    // If we fell back to knowledge base, run it through the interpreter prompt
    if (finalResult.source === "knowledge_base" && kbText) {
      try {
        const response = await generateText({
          messages: [
            {
              role: "system",
              content: SEARCH_INTERPRETER_PROMPT,
            },
            {
              role: "user",
              content: `User asked: "${args.query}"\n\nSearch results: ${kbText}`,
            },
          ],
          model: openai.chat("gpt-4o-mini"),
        });

        finalResult = {
          ...finalResult,
          summary: response.text,
        };
      } catch (error) {
        console.error("[DatabaseQueryTool] KB interpretation failed", error);
      }
    }

    // Persist assistant message via supportAgent for continuity
    await supportAgent.saveMessage(ctx, {
      threadId: ctx.threadId,
      message: {
        role: "assistant",
        content: finalResult.summary,
      },
    });

    return finalResult.summary;
  },
});
