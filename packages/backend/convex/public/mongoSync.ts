"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const syncMongoData = action({
    args: {
        collections: v.optional(v.array(v.string())), // Optional: specify which collections to sync
    },
    handler: async (ctx, args): Promise<any> => {
        // Get the organization ID from the user's identity
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("User not authenticated");
        }

        const orgId = identity.orgId as string;
        if (!orgId) {
            throw new Error("Organization ID not found");
        }

        // TODO: Fix MongoDB integration - private functions not available due to "use node" directive
        // return await ctx.runAction(internal.private.mongoSync.syncMongoDataToRAG, {
        //     organizationId: orgId,
        //     collections: args.collections,
        // });
        return {
            success: false,
            message: "MongoDB sync not available - requires Node.js runtime",
            error: "Private functions not accessible due to Node.js dependencies",
            organizationId: orgId,
            syncResults: []
        };
    }
});

export const getMongoStats = action({
    args: {},
    handler: async (ctx, args): Promise<any> => {
        // TODO: Fix MongoDB integration - private functions not available due to "use node" directive
        // return await ctx.runAction(internal.private.mongoSync.getMongoCollectionStats, {});
        return {
            success: false,
            message: "MongoDB stats not available - requires Node.js runtime",
            error: "Private functions not accessible due to Node.js dependencies",
            stats: {}
        };
    }
});
