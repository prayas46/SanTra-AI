import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const upsertConfig = mutation({
  args: {
    apiBaseUrl: v.optional(v.string()),
    auth: v.optional(
      v.object({
        type: v.union(v.literal("none"), v.literal("api_key_header")),
        headerName: v.optional(v.string()),
      })
    ),
    actions: v.optional(
      v.array(
        v.object({
          name: v.string(),
          label: v.optional(v.string()),
          description: v.optional(v.string()),
          type: v.union(v.literal("front_end"), v.literal("rest_api")),
          clientEvent: v.optional(v.string()),
          method: v.optional(v.string()),
          path: v.optional(v.string()),
          queryParamsTemplate: v.optional(v.any()),
          bodyTemplate: v.optional(v.any()),
        })
      )
    ),
    languages: v.optional(v.array(v.string())),
    defaultGreeting: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      });
    }

    const orgId = identity.orgId as string;

    if (!orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Organization not found",
      });
    }

    const existingConfig = await ctx.db
      .query("voiceNavConfigs")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .unique();

    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, {
        apiBaseUrl: args.apiBaseUrl,
        auth: args.auth,
        actions: args.actions,
        languages: args.languages,
        defaultGreeting: args.defaultGreeting,
      });
    } else {
      await ctx.db.insert("voiceNavConfigs", {
        organizationId: orgId,
        apiBaseUrl: args.apiBaseUrl,
        auth: args.auth,
        actions: args.actions,
        languages: args.languages,
        defaultGreeting: args.defaultGreeting,
      });
    }
  },
});

export const getConfig = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      });
    }

    const orgId = identity.orgId as string;

    if (!orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Organization not found",
      });
    }

    const config = await ctx.db
      .query("voiceNavConfigs")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .unique();

    return config;
  },
});
