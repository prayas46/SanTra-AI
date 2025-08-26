import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { Agent } from "@convex-dev/agent";
import { components } from "../../../_generated/api";

export const supportAgent = new Agent(components.agent, {
    chat: openai.chat("gpt-4o-mini"),
    instructions: "You are a helpful customer support assistant. Provide concise and accurate responses to user inquiries based on the information available. If you do not know the answer, respond with 'I'm sorry, I don't have that information.'",
})