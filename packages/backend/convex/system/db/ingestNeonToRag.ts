import { action } from "../../_generated/server";
import { v } from "convex/values";
import { contentHashFromArrayBuffer } from "@convex-dev/rag";
import rag from "../ai/rag";
import { executeQuery } from "../../db/neonConnection";

const EXCLUDED_TABLES = ["_prisma_migrations"];

function rowToText(table: string, row: any): string {
  const keys = Object.keys(row).sort();
  const lines = keys.map((key) => `${key}: ${String((row as any)[key])}`);
  return `Table: ${table}\n${lines.join("\n")}`;
}

export const ingest = action({
  args: {
    organizationId: v.string(),
    limitPerTable: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limitPerTable && args.limitPerTable > 0 ? Math.min(args.limitPerTable, 200) : 100;
    const encoder = new TextEncoder();
    const stats: Record<string, number> = {};

    const tablesResult = await executeQuery<{ table_name: string }>(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      `,
    );

    const tables = tablesResult.rows
      .map((row) => (row as any).table_name as string)
      .filter((name) => !EXCLUDED_TABLES.includes(name));

    for (const tableName of tables) {
      try {
        const sql = `${"SELECT * FROM "}${tableName} LIMIT $1`;
        const params = [limit];
        const result = await executeQuery<any>(sql, params);

        let ingested = 0;
        for (let i = 0; i < result.rows.length; i++) {
          const row = result.rows[i];
          const text = rowToText(tableName, row);
          const bytes = encoder.encode(text);
          const { created } = await rag.add(ctx, {
            namespace: args.organizationId,
            text,
            key: `${tableName}:${String((row as any).id ?? i)}`,
            title: `${tableName} ${String((row as any).id ?? i)}`,
            metadata: {
              table: tableName,
              organizationId: args.organizationId,
            },
            contentHash: await contentHashFromArrayBuffer(bytes.buffer),
          });
          if (created) {
            ingested += 1;
          }
        }

        stats[tableName] = ingested;
      } catch (error) {
        console.error("[NeonToRag] Ingestion failed for table", tableName, error);
      }
    }

    return { success: true, organizationId: args.organizationId, stats };
  },
});
