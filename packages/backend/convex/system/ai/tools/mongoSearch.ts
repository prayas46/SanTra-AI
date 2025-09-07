
import { createTool } from "@convex-dev/agent";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import z from "zod";
import { internal } from "../../../_generated/api";
import { supportAgent } from "../agents/supportAgent";
import rag from "../rag";
import { SEARCH_INTERPRETER_PROMPT } from "../constants";


export const mongoSearch = createTool({
    description: "Search the medical database (MongoDB) for specific patient, doctor, appointment, prescription, or billing information",
    args: z.object({
        query: z
            .string()
            .describe("The search query to find relevant medical information (e.g., 'patient John Smith', 'appointments today', 'prescriptions for diabetes')")
    }),
    handler: async (ctx, args) => {
        if (!ctx.threadId) {
            return "Missing thread ID";
        }

        const conversation = await ctx.runQuery(
            internal.system.conversations.getByThreadId,
            { threadId: ctx.threadId },
        );

        if (!conversation) {
            return "Conversation not found";
        }

        const orgId = conversation.organizationId;

        // Search specifically for MongoDB data by adding metadata filter
        const searchResult = await rag.search(ctx, {
            namespace: orgId,
            query: args.query,
            limit: 5,
        });

        if (searchResult.entries.length === 0) {
            return "I couldn't find any medical database information related to your query. The medical database might not be synced yet, or the information you're looking for might not be available.";
        }

        const contextText = `Found medical database results from: ${searchResult.entries
            .map((e) => e.title || null)
            .filter((t) => t !== null)
            .join(", ")}. Here is the medical information:\n\n${searchResult.text}`;

        const response = await generateText({
            messages: [
                {
                    role: "system",
                    content: `You are a medical assistant AI. You help users find information from the medical database. 
                    Be precise and professional when discussing medical information. 
                    Always mention that this information comes from the medical database.
                    If the information is incomplete, suggest contacting the medical staff for more details.
                    
                    ${SEARCH_INTERPRETER_PROMPT}`,
                },
                {
                    role: "user",
                    content: `User asked about medical information: "${args.query}"\n\nMedical database results: ${contextText}`
                }
            ],
            model: openai.chat("gpt-4o-mini"),
        });

        await supportAgent.saveMessage(ctx, {
            threadId: ctx.threadId,
            message: {
                role: "assistant",
                content: response.text,
            },
        });

        return response.text;
    }
});
