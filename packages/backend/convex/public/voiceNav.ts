import { ConvexError, v } from "convex/values";
import { action, query, internalQuery } from "../_generated/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { internal } from "../_generated/api";
import { getSecretValue, parseSecretString } from "../lib/secrets";

function applyTemplate(template: any, params: Record<string, any>): any {
  if (template === null || template === undefined) {
    return template;
  }

  if (typeof template === "string") {
    return template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
      const value = params[key.trim()];
      return value === undefined || value === null ? "" : String(value);
    });
  }

  if (Array.isArray(template)) {
    return template.map((item) => applyTemplate(item, params));
  }

  if (typeof template === "object") {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(template)) {
      result[k] = applyTemplate(v, params);
    }
    return result;
  }

  return template;
}

type VoiceNavActionConfig = {
  name: string;
  label?: string;
  description?: string;
  type: "front_end" | "rest_api";
  clientEvent?: string;
  method?: string;
  path?: string;
  queryParamsTemplate?: any;
  bodyTemplate?: any;
};

export const getByOrganizationId = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("voiceNavConfigs")
      .withIndex("by_organization_id", (q: any) =>
        q.eq("organizationId", args.organizationId)
      )
      .unique();

    return config;
  },
});

export const internalGetByOrganizationId = internalQuery({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("voiceNavConfigs")
      .withIndex("by_organization_id", (q: any) =>
        q.eq("organizationId", args.organizationId)
      )
      .unique();

    return config;
  },
});

export const interpret = action({
  args: {
    organizationId: v.string(),
    text: v.string(),
    language: v.optional(v.string()),
    conversationState: v.optional(
      v.object({
        state: v.optional(v.string()),
        context: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const config = await ctx.runQuery(
      internal.public.voiceNav.internalGetByOrganizationId,
      {
        organizationId: args.organizationId,
      }
    );

    if (!config) {
      const fallback = "Voice navigation is not configured for this organization.";
      return {
        actions: [],
        response: fallback,
        conversationState: {
          state: "idle",
          context: args.conversationState?.context || {},
        },
      };
    }

    const actions = (config.actions ?? []) as VoiceNavActionConfig[];

    if (actions.length === 0) {
      const fallback = "Voice navigation is not configured for this organization.";
      return {
        actions: [],
        response: fallback,
        conversationState: {
          state: "idle",
          context: args.conversationState?.context || {},
        },
      };
    }

    const actionsDescription = actions.map((action: VoiceNavActionConfig) => ({
      name: action.name,
      type: action.type,
      description: action.description || "",
      clientEvent: action.clientEvent,
      method: action.method,
      path: action.path,
      queryParamsTemplate: action.queryParamsTemplate,
      bodyTemplate: action.bodyTemplate,
    }));

    const language =
      args.language || (config.languages && config.languages[0]) || "en-US";

    const systemPrompt =
      `You are a voice navigation assistant for a website. The user's preferred language code is ${language}.\n\n` +
      `You can only return actions from this list (name, type, and params schema):\n` +
      `${JSON.stringify(actionsDescription, null, 2)}\n\n` +
      `You must ALWAYS respond with valid JSON in this exact format:\n` +
      `{"actions":[{"type":"<action_name>","params":{}}],"response":"<spoken_response>","conversationState":{"state":"<state>","context":{}}}\n\n` +
      `Rules:\n` +
      `- "type" MUST be one of the action names above.\n` +
      `- "params" MUST be a JSON object with only simple JSON values (strings, numbers, booleans, arrays, objects).\n` +
      `- For front_end actions, "params" should contain fields that the website can use to decide what to do (for example: {"target":"cart"}).\n` +
      `- For rest_api actions, "params" should contain values that will be injected into query/body templates defined in the config.\n` +
      `- "response" is what will be spoken back to the user, in the same language as they speak if possible.\n` +
      `- "conversationState.state" can be "idle" or any other useful string.\n` +
      `- Do not include any extra top-level fields beyond actions, response, and conversationState.`;

    const userContent = args.text;

    const result = await generateText({
      model: openai.chat("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    let parsed: any;

    try {
      parsed = JSON.parse(result.text);
    } catch (error) {
      const fallback = "I could not understand that command. Please try again.";
      return {
        actions: [],
        response: fallback,
        conversationState: {
          state: args.conversationState?.state || "idle",
          context: args.conversationState?.context || {},
        },
      };
    }

    if (!parsed.actions || !Array.isArray(parsed.actions)) {
      parsed.actions = [];
    }

    if (!parsed.conversationState) {
      parsed.conversationState = {
        state: args.conversationState?.state || "idle",
        context: args.conversationState?.context || {},
      };
    }

    return parsed;
  },
});

export const execute = action({
  args: {
    organizationId: v.string(),
    actions: v.array(
      v.object({
        type: v.string(),
        params: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const config = await ctx.runQuery(
      internal.public.voiceNav.internalGetByOrganizationId,
      {
        organizationId: args.organizationId,
      }
    );

    if (!config) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Voice navigation config not found",
      });
    }

    if (!config.apiBaseUrl) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "apiBaseUrl is not configured for this organization",
      });
    }

    let apiKeyHeaderValue: string | undefined;

    const plugin = await ctx.runQuery(
      internal.system.plugins.getByOrganizationIdAndService,
      {
        organizationId: args.organizationId,
        service: "voice_nav",
      }
    );

    if (plugin) {
      const secretValue = await getSecretValue(plugin.secretName);
      const secretData = parseSecretString<{
        apiKeyHeaderValue?: string;
      }>(secretValue);

      if (secretData && secretData.apiKeyHeaderValue) {
        apiKeyHeaderValue = secretData.apiKeyHeaderValue;
      }
    }

    const actions = (config.actions ?? []) as VoiceNavActionConfig[];

    const results: Array<{
      type: string;
      ok: boolean;
      status: number;
      data: any;
      error?: string;
      skipped?: boolean;
    }> = [];

    for (const actionItem of args.actions) {
      const actionConfig =
        actions.find((a: VoiceNavActionConfig) => a.name === actionItem.type) || null;

      if (!actionConfig) {
        results.push({
          type: actionItem.type,
          ok: false,
          status: 0,
          data: null,
          error: "Unknown action type",
        });
        continue;
      }

      if (actionConfig.type !== "rest_api") {
        results.push({
          type: actionItem.type,
          ok: true,
          status: 0,
          data: null,
          skipped: true,
        });
        continue;
      }

      if (!actionConfig.method || !actionConfig.path) {
        results.push({
          type: actionItem.type,
          ok: false,
          status: 0,
          data: null,
          error: "REST action is missing method or path",
        });
        continue;
      }

      try {
        const base = new URL(config.apiBaseUrl);
        const url = new URL(actionConfig.path, base);

        const params = (actionItem.params || {}) as Record<string, any>;

        if (actionConfig.queryParamsTemplate) {
          const qp = applyTemplate(actionConfig.queryParamsTemplate, params);
          if (qp && typeof qp === "object") {
            for (const [k, v] of Object.entries(qp)) {
              if (v !== undefined && v !== null) {
                url.searchParams.set(k, String(v));
              }
            }
          }
        }

        let body: any = undefined;

        if (actionConfig.bodyTemplate) {
          body = applyTemplate(actionConfig.bodyTemplate, params);
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (
          config.auth &&
          config.auth.type === "api_key_header" &&
          config.auth.headerName &&
          apiKeyHeaderValue
        ) {
          headers[config.auth.headerName] = apiKeyHeaderValue;
        }

        const response = await fetch(url.toString(), {
          method: actionConfig.method,
          headers,
          body:
            body !== undefined &&
            actionConfig.method &&
            actionConfig.method.toUpperCase() !== "GET"
              ? JSON.stringify(body)
              : undefined,
        });

        let data: any = null;
        try {
          data = await response.json();
        } catch {
          try {
            data = await response.text();
          } catch {
            data = null;
          }
        }

        results.push({
          type: actionItem.type,
          ok: response.ok,
          status: response.status,
          data,
        });
      } catch (error: any) {
        results.push({
          type: actionItem.type,
          ok: false,
          status: 0,
          data: null,
          error: error?.message || "Request failed",
        });
      }
    }

    return { results };
  },
});
