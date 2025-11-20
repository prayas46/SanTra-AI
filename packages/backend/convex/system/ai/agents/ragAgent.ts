/**
 * RAG + Database Orchestration Agent
 *
 * This agent coordinates between the Neon PostgreSQL database
 * and the existing knowledge-base RAG system, following the rules:
 * - Always query database first and prioritize its results
 * - Fallback to knowledge base (RAG) when database has no results
 * - If both are empty, respond with a clear no-data message
 * - Both data sources are queried in parallel for performance
 */

import { openai } from "@ai-sdk/openai";
import { Agent } from "@convex-dev/agent";
import { components } from "../../../_generated/api";
import rag from "../rag";
import { databaseQueryTool } from "../tools/databaseQueryTool";
import { search } from "../tools/search";

export const ragAgent = new Agent(components.agent, {
  chat: openai.chat("gpt-4o-mini"),
  instructions: `You are a support assistant with access to TWO data sources:\n\n1. A PostgreSQL database (via the \\\"query_database\\\" tool) that contains user-specific, real-time data like tickets and orders.\n2. A knowledge base (via the \\\"searchTool\\\" tool) that contains general documentation and FAQs.\n\nCRITICAL RULES:\n- Always try to answer using the DATABASE FIRST.\n- If the database returns any relevant records, use ONLY those and do NOT query the knowledge base for that turn.\n- If the database returns NO records, then use the knowledge base as a fallback.\n- If both sources have no relevant data, clearly say that you couldn't find anything.\n- Never invent or guess database data.\n- Keep responses concise, accurate, and directly grounded in the data you retrieved.`,
});

/**
 * Helper function used by the public messages action to call the agent
 * with the correct tool configuration and priority logic.
 */
export async function runRagAgent({
  ctx,
  threadId,
  organizationId,
  userId,
  prompt,
}: {
  ctx: any;
  threadId: string;
  organizationId: string;
  userId?: string;
  prompt: string;
}): Promise<{ text: string }> {
  // We instruct the LLM (in the prompt above) about the priority order.
  // Here we expose both tools but the model decides which to call.
  // Database tool is described as primary, search as fallback.

  return ragAgent.generateText(
    ctx,
    { threadId },
    {
      prompt,
      tools: {
        // Database query tool (Neon PostgreSQL)
        query_database: databaseQueryTool,
        // Existing knowledge base vector search tool
        searchTool: search,
      },
      toolChoice: "auto",
      // Optional: can add additional metadata/context later
      // such as organizationId/userId for tool calls
      // but each tool already expects those via its args.
    }
  );
}
