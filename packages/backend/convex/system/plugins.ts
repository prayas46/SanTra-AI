import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

// Refactored code

export const upsert = internalMutation({
    args: {
        service: v.union(v.literal("vapi"), v.literal("database")),
        secretName: v.string(),
        organizationId: v.string(),
    },
    handler: async (ctx, args) => {
        const existingPlugin = await ctx.db
            .query("plugins")
            .withIndex("by_organization_id_and_service", (q) =>
                q.eq("organizationId", args.organizationId).eq("service", args.service)
            )
            .unique();
        
        if (existingPlugin) {
            // Do something with existingPlugin
            await ctx.db.patch(existingPlugin._id, {
                service: args.service,
                secretName: args.secretName,
                organizationId: args.organizationId,
            });
        }   else {
            await ctx.db.insert("plugins", {
                service: args.service,
                secretName: args.secretName,
                organizationId: args.organizationId,
            });
        }
    }
});

export const getByOrganizationIdAndService = internalQuery({
    args: {
        organizationId: v.string(),
        service: v.union(v.literal("vapi"), v.literal("database")),
    },
    handler: async (ctx, args) => {
        return await ctx.db
        .query("plugins")
        .withIndex("by_organization_id_and_service", (q) =>
            q.eq("organizationId", args.organizationId).eq("service", args.service)
        )
        .unique();
    },
});

