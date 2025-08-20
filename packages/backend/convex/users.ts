import { query, mutation } from "./_generated/server";

export const getMany = query({
    args: {},
    handler: async(ctx) => {
        // Implement your logic to retrieve multiple users
        const users = await ctx.db.query("users").collect();
        
        return users;
    }
});

export const add = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (identity === null) {
        throw new Error("Not authenticated");
        }

        const orgId = identity.orgId as string;

        if (!orgId) {
            throw new Error("Missing Organization");
        }

        // Implement your logic to update a user
        const userId = await ctx.db.insert("users", {
            name:"SanTra-AI",
        });
        // Update user logic here

        return userId;
    },
});