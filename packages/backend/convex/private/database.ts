import { action } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { executeOrgQuery } from "../db/neonConnection";
function serializeForConvex(value: any): any {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeForConvex(item));
  }
  if (value && typeof value === "object") {
    const result: any = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeForConvex(val);
    }
    return result;
  }
  return value;
}

export const test = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; message: string }> => {
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

    const result = await ctx.runAction(
      internal.system.db.testConfiguredDatabase.testConfiguredDatabase,
      {
        organizationId: orgId,
      }
    ) as { success: boolean; message: string };

    return result;
  },
});

export const listTables = action({
  args: {},
  handler: async (ctx): Promise<{ tables: string[] }> => {
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

    const result = await executeOrgQuery<{ table_name: string }>(
      orgId,
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
      `,
      [],
    );

    const tables = result.rows.map(
      (row) => (row as any).table_name as string,
    );

    return { tables };
  },
});

export const previewTable = action({
  args: {
    tableName: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ rows: any[]; rowCount: number }> => {
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

    if (!/^[a-zA-Z0-9_]+$/.test(args.tableName)) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Invalid table name",
      });
    }

    const limit =
      args.limit && args.limit > 0 ? Math.min(args.limit, 200) : 20;

    const sql = `SELECT * FROM ${args.tableName} ORDER BY 1 LIMIT $1`;
    const result = await executeOrgQuery<any>(orgId, sql, [limit]);
    const rows = result.rows.map((row) => serializeForConvex(row));

    return {
      rows,
      rowCount: result.rowCount,
    };
  },
});

export const ingest = action({
  args: {
    limitPerTable: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string; stats?: any }> => {
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

    const result = await ctx.runAction(
      (internal as any).system.db.ingestNeonToRag.ingest,
      {
        organizationId: orgId,
        limitPerTable: args.limitPerTable,
      },
    ) as { success: boolean; message: string; stats?: any };

    return result;
  },
});
