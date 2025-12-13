import { v } from "convex/values"
import { internal } from "../_generated/api"
import { internalAction } from "../_generated/server"
import { upsertSecret } from "../lib/secrets"

export const upsert = internalAction({
  args: {
    organizationId: v.string(),
    service: v.union(
      v.literal("vapi"),
      v.literal("voice_nav"),
      v.literal("database"),
    ),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const secretName = `tenant/${args.organizationId}/${args.service}`;

    await upsertSecret(secretName, args.value);

    await ctx.runMutation(internal.system.plugins.upsert as any, {
      organizationId: args.organizationId,
      // Cast service to any until Convex codegen includes the new
      // 'database' service literal in the generated types.
      service: args.service as any,
      secretName,
    });

    return { status: "success" };
  },
});