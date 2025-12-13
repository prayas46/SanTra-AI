import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";

export const upsert = mutation({
  args: {
    service: v.union(
      v.literal("vapi"),
      v.literal("voice_nav"),
      v.literal("database"),
    ),
    value: v.any(),
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

    // TODO : Check for subscription

    await ctx.scheduler.runAfter(0, internal.system.secrets.upsert, {
      organizationId: orgId,
      // Cast to any to stay compatible with generated "vapi" types
      // until Convex codegen is rerun to include the "database" service.
      service: args.service as any,
      value: args.value,
    });
  },
});
