import { ConvexError, v } from "convex/values";
import { action, query } from "../_generated/server";
import { components, internal } from "../_generated/api";
import { supportAgent } from "../system/ai/agents/supportAgent";
import { runRagAgent } from "../system/ai/agents/ragAgent";

import { paginationOptsValidator } from "convex/server";
import { escalateConversation } from "../system/ai/tools/escalateConversation";
import { resolveConversation } from "../system/ai/tools/resolveConversation";
import { saveMessage } from "@convex-dev/agent";
import { search } from "../system/ai/tools/search";
import { databaseQueryTool } from "../system/ai/tools/databaseQueryTool";

export const create = action({
    args: {
        prompt: v.string(),
        threadId: v.string(),
        contactSessionId: v.id("contactSessions"),
    },
    handler: async (ctx, args) => {
        const contactSession = await ctx.runQuery(
            internal.system.contactSessions.getOne,
            {
                contactSessionId: args.contactSessionId,
            }
        );

        if (!contactSession || contactSession.expiresAt < Date.now()) {
            throw new ConvexError({
                code: "UNAUTHORIZED",
                message: "Invalid session",
            });
        }

        const conversation = await ctx.runQuery(
            internal.system.conversations.getByThreadId,
            {
                threadId: args.threadId,
            },
        );

        if (!conversation) {
            throw new ConvexError({
                code: "NOTE_FOUND",
                message: "conversation not Found"
            });
        }

        if (conversation.status === "resolved") {
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Conversation Resolved",
            });
        }

        //TODO Implement Subscription Check

        const shouldTriggerAgent = conversation.status === "unresolved";

        if (shouldTriggerAgent) {
            // Prefer the RAG + Database orchestrator agent.
            try {
                await runRagAgent({
                    ctx,
                    threadId: args.threadId,
                    organizationId: conversation.organizationId,
                    userId: contactSession?.email ?? undefined,
                    prompt: args.prompt,
                });
            } catch (error) {
                console.error("[messages.create] runRagAgent failed, falling back to supportAgent", error);

                // Fallback to the original supportAgent behavior with tools
                await supportAgent.generateText(
                    ctx,
                    { threadId: args.threadId },
                    {
                        prompt: args.prompt,
                        tools: {
                            escalateConversationTool: escalateConversation,
                            resolveConversationTool: resolveConversation,
                            searchTool: search,
                            databaseQueryTool,
                        },
                    },
                );
            }
        } else {
            await saveMessage(ctx, components.agent, {
                threadId: args.threadId,
                prompt: args.prompt,
            });
        }
    },
});

export const getMany = query({
    args: {
        threadId: v.string(),
        paginationOpts: paginationOptsValidator,
        contactSessionId: v.id("contactSessions"),
    },
    handler: async (ctx, args) => {
        const contactSession = await ctx.db.get(args.contactSessionId)


        if (!contactSession || contactSession.expiresAt < Date.now()) {
            throw new ConvexError({
                code: "UNAUTHORIZED",
                message: "Invalid session",
            });
        }



        const paginated = await supportAgent.listMessages(ctx, {
            threadId: args.threadId,
            paginationOpts: args.paginationOpts,
        });


        return paginated;
    },

});