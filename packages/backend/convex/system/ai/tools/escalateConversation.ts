import { createTool } from "@convex-dev/agent";
import z from "zod";
import { internal } from "../../../_generated/api";
import { supportAgent } from "../agents/supportAgent";

export const escalateConversation = createTool({
    description: "Escalate a conversation",
    args: z.object({}),
    handler: async (ctx) => {
        if(!ctx.threadId) {
            return "Missing Thread ID";
        }

        await ctx.runMutation(internal.system.conversations.escalate, {
            thread: ctx.threadId,// in video shown threadId but after debugging its thread now
        });

        await supportAgent.saveMessage(ctx, {
            threadId: ctx.threadId,
            message: {
                role: "assistant",
                content: "Conversation escalaetd to a human operator"
            }
        });

        return "Conversation escalaetd to a human operator"
    },
});