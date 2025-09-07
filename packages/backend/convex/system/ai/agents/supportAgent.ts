import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { Agent } from "@convex-dev/agent";
import { components } from "../../../_generated/api";
import { resolveConversation } from "../tools/resolveConversation";
import { escalateConversation } from "../tools/escalateConversation";
import { mongoSearch } from "../tools/mongoSearch";
import { SUPPORT_AGENT_PROMPT } from "../constants";

export const supportAgent = new Agent(components.agent, {
    chat: openai.chat("gpt-4o-mini"),
    instructions: SUPPORT_AGENT_PROMPT,
    tools: {
        resolveConversation,
        escalateConversation,
        mongoSearch,
    }
})