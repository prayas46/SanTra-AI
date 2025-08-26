import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { Agent } from "@convex-dev/agent";
import { components } from "../../../_generated/api";
import { resolveConversation } from "../tools/resolveConversation";
import { escalateConversation } from "../tools/escalateConversation";

export const supportAgent = new Agent(components.agent, {
    chat: openai.chat("gpt-4o-mini"),
    instructions: "You are a helpful customer support assistant. Provide concise and accurate responses to user inquiries based on the information available. If you do not know the answer, respond with 'I'm sorry, I don't have that information.' Use \"resolveConversation\" tool when user expresses finalization of the conversation. Use \"escalateConversation\" tool when the user expresses frustration, or requests a human explicitly.",
})