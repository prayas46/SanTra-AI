import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { executeOrgQuery } from "../../db/neonConnection";

export const testConfiguredDatabase = internalAction({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const plugin = await ctx.runQuery(
      internal.system.plugins.getByOrganizationIdAndService as any,
      {
        organizationId: args.organizationId,
        service: "database" as any,
      },
    );

    if (!plugin) {
      return {
        success: false,
        message: "No database connection configured for this organization.",
      };
    }

    try {
      const result = await executeOrgQuery<any>(
        args.organizationId,
        "SELECT 1 as test",
        [],
      );

      const ok = result.rows.length > 0;

      return {
        success: ok,
        message: ok
          ? "Successfully connected to the configured database."
          : "Connected, but test query returned no rows.",
      };
    } catch (error) {
      return {
        success: false,
        message:
          "Connection failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      };
    }
  },
});
