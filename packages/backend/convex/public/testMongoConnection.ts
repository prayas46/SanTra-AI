import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const testConnection = internalAction({
    args: {},
    handler: async (ctx): Promise<any> => {
        // TODO: Fix MongoDB integration - private functions not available due to "use node" directive
        // return await ctx.runAction(internal.private.testMongoConnection.testMongoConnection, {});
        return {
            success: false,
            message: "MongoDB connection test not available - requires Node.js runtime",
            error: "Private functions not accessible due to Node.js dependencies"
        };
    }
});
