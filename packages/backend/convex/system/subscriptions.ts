// packages/backend/convex/system/subscriptions.ts
import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

// Upserts (creates or updates) a subscription record for an organization.
export const upsert = internalMutation({
  args: {
    organizationId: v.string(),
    status: v.string(), // e.g., 'active', 'canceled', 'ended', 'incomplete'
  },
  handler: async (context, args) => {
    // Check if a subscription already exists for this organization.
    const existingSubscription = await context.db
      .query("subscriptions")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    if (existingSubscription) {
      // If it exists, update its status.
      await context.db.patch(existingSubscription._id, { status: args.status });
    } else {
      // Otherwise, insert a new subscription record.
      await context.db.insert("subscriptions", {
        organizationId: args.organizationId,
        status: args.status,
      });
    }
  },
});

// Retrieves a subscription record by organization ID.
export const getByOrganizationId = internalQuery({
  args: {
    organizationId: v.string(),
  },
  handler: async (context, args) => {
    return await context.db
      .query("subscriptions")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .unique();
  },
});