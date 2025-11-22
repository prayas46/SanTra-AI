/**
 * Neon PostgreSQL Database Connection
 * 
 * Provides secure connections to Neon PostgreSQL database using the
 * HTTP-based `neon` client. This avoids WebSocket requirements that
 * are not available in Convex function runtimes.
 */

import { neon } from "@neondatabase/serverless";
import {
  RDSDataClient,
  ExecuteStatementCommand,
  type Field,
  type SqlParameter,
  type ColumnMetadata,
} from "@aws-sdk/client-rds-data";
import { getSecretValue, parseSecretString } from "../lib/secrets";

/**
 * Cached Neon SQL client instance.
 * Initialized lazily to avoid issues during Convex function imports.
 */
let neonSql: ReturnType<typeof neon> | null = null;

type OrgNeonConfig = {
  provider: "neon";
  connectionString: string;
};

type OrgRdsConfig = {
  provider: "aws_rds";
  rdsResourceArn: string;
  rdsSecretArn: string;
  rdsDatabase: string;
  awsRegion?: string;
};

type OrgDbConfig = OrgNeonConfig | OrgRdsConfig;

/**
 * Cached Neon SQL client instances for organization-specific connections.
 */
const clientCache = new Map<string, ReturnType<typeof neon>>();

/**
 * Cached database configuration per organization.
 */
const orgConfigCache = new Map<string, OrgDbConfig | null>();

const rdsClientCache = new Map<string, RDSDataClient>();

function getRdsClient(region?: string): RDSDataClient {
  const effectiveRegion =
    region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
  let client = rdsClientCache.get(effectiveRegion);
  if (!client) {
    client = new RDSDataClient({ region: effectiveRegion });
    rdsClientCache.set(effectiveRegion, client);
  }
  return client;
}

function toRdsField(value: any): Field {
  if (value === null || value === undefined) {
    return { isNull: true };
  }

  const t = typeof value;
  if (t === "string") {
    return { stringValue: value as string };
  }
  if (t === "number") {
    // Use doubleValue for general numeric support
    return { doubleValue: value as number };
  }
  if (t === "boolean") {
    return { booleanValue: value as boolean };
  }

  try {
    return { stringValue: JSON.stringify(value) };
  } catch {
    return { stringValue: String(value) };
  }
}

function fromRdsField(field: Field | undefined): any {
  if (!field) return null;
  if (field.isNull) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.longValue !== undefined) return field.longValue;
  if (field.doubleValue !== undefined) return field.doubleValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.blobValue !== undefined) return field.blobValue;
  if (field.arrayValue !== undefined) return field.arrayValue;
  return null;
}

function buildRdsStatement(
  query: string,
  params: any[],
): { sql: string; parameters: SqlParameter[] } {
  const sql = query.replace(/\$(\d+)/g, (_match, index) => `:p${index}`);
  const parameters: SqlParameter[] = params.map((value, idx) => ({
    name: `p${idx + 1}`,
    value: toRdsField(value),
  }));
  return { sql, parameters };
}

function mapRdsRecordsToRows<T>(
  records: Field[][] | undefined,
  metadata: ColumnMetadata[] | undefined,
): T[] {
  if (!records || !metadata) return [];

  const rows: T[] = [];
  for (const record of records) {
    const obj: any = {};
    for (let i = 0; i < metadata.length; i++) {
      const col = metadata[i];
      const field = record[i];
      if (!col) {
        const fallbackName = `col_${i + 1}`;
        obj[fallbackName] = fromRdsField(field);
        continue;
      }
      const name = col.name || `col_${i + 1}`;
      obj[name] = fromRdsField(field);
    }
    rows.push(obj as T);
  }
  return rows;
}

/**
 * Get the Neon database URL from environment variables.
 *
 * @throws Error if DATABASE_URL is not configured
 * @returns The Neon database connection string
 */
function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Please set it in your Convex environment."
    );
  }

  return databaseUrl;
}

/**
 * Get or create a Neon HTTP SQL client.
 *
 * This client uses HTTPS + fetch under the hood and works in Convex
 * actions without requiring a WebSocket implementation.
 */
function getNeonClient() {
  if (!neonSql) {
    const connectionString = getDatabaseUrl();
    neonSql = neon(connectionString);
  }

  return neonSql;
}

function getNeonClientForConnectionString(connectionString: string) {
  let client = clientCache.get(connectionString);
  if (!client) {
    client = neon(connectionString);
    clientCache.set(connectionString, client);
  }

  return client;
}

async function getOrgDbConfig(
  organizationId: string,
): Promise<OrgDbConfig | null> {
  if (orgConfigCache.has(organizationId)) {
    return orgConfigCache.get(organizationId)!;
  }

  const secretName = `tenant/${organizationId}/database`;

  try {
    const secret = await getSecretValue(secretName);
    const config = parseSecretString<{
      provider?: string;
      connectionString?: string;
      rdsResourceArn?: string;
      rdsSecretArn?: string;
      rdsDatabase?: string;
      awsRegion?: string;
    }>(secret);

    if (!config) {
      console.warn(
        "[Database] Failed to parse database secret for organization",
        organizationId,
      );
      orgConfigCache.set(organizationId, null);
      return null;
    }

    const provider = config.provider || "neon";

    if (provider === "neon") {
      if (!config.connectionString) {
        console.warn(
          "[Database] No connectionString found in database secret for organization",
          organizationId,
        );
        orgConfigCache.set(organizationId, null);
        return null;
      }

      const value: OrgNeonConfig = {
        provider: "neon",
        connectionString: config.connectionString,
      };
      orgConfigCache.set(organizationId, value);
      return value;
    }

    if (provider === "aws_rds") {
      const { rdsResourceArn, rdsSecretArn, rdsDatabase } = config;
      if (!rdsResourceArn || !rdsSecretArn || !rdsDatabase) {
        console.warn(
          "[Database] Incomplete AWS RDS config in database secret for organization",
          organizationId,
        );
        orgConfigCache.set(organizationId, null);
        return null;
      }

      const value: OrgRdsConfig = {
        provider: "aws_rds",
        rdsResourceArn,
        rdsSecretArn,
        rdsDatabase,
        awsRegion: config.awsRegion,
      };
      orgConfigCache.set(organizationId, value);
      return value;
    }

    console.warn(
      "[Database] Unsupported database provider",
      provider,
      "for organization",
      organizationId,
    );
    orgConfigCache.set(organizationId, null);
    return null;
  } catch (error) {
    console.warn(
      "[Database] Failed to load database secret for organization",
      organizationId,
      error instanceof Error ? error.message : "Unknown error",
    );
    orgConfigCache.set(organizationId, null);
    return null;
  }
}

/**
 * Execute a parameterized SQL query using the Neon HTTP client.
 *
 * @param query - SQL query with $1, $2, etc. placeholders
 * @param params - Array of parameter values
 * @returns Query results
 *
 * @example
 * ```typescript
 * const result = await executeQuery(
 *   "SELECT * FROM tickets WHERE user_id = $1 AND organization_id = $2",
 *   [userId, orgId]
 * );
 * ```
 */
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<{ rows: T[]; rowCount: number }> {
  const sql = getNeonClient();

  try {
    console.log("[Database] Executing query:", { query: query.substring(0, 100), paramCount: params.length });
    
    // Use the sql.query() method for conventional function calls with $1, $2 placeholders
    const result = await sql.query(query, params);

    console.log("[Database] Query executed successfully:", { 
      rowCount: Array.isArray(result) ? result.length : 'unknown',
      firstRowType: Array.isArray(result) && result[0] ? typeof result[0] : 'none'
    });

    // Ensure we always return an array of proper type
    const resultRows: T[] = Array.isArray(result) ? result as T[] : [];
    
    return {
      rows: resultRows,
      rowCount: resultRows.length,
    };
  } catch (error) {
    console.error("[Database] Query execution failed:", {
      error: error instanceof Error ? (error as Error).message : "Unknown error",
      query: query.substring(0, 100), // Log first 100 chars for debugging
      params: params.length > 0 ? `[${params.length} parameters]` : 'no parameters'
    });

    throw new Error(
      `Database query failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function executeOrgQuery<T = any>(
  organizationId: string,
  query: string,
  params: any[] = [],
): Promise<{ rows: T[]; rowCount: number }> {
  const config = await getOrgDbConfig(organizationId);

  if (!config) {
    // Fallback to default environment-based client
    return executeQuery<T>(query, params);
  }

  if (config.provider === "aws_rds") {
    const client = getRdsClient(config.awsRegion);

    try {
      console.log("[Database] Executing org-scoped query via AWS RDS Data API:", {
        organizationId,
        query: query.substring(0, 100),
        paramCount: params.length,
      });

      const { sql, parameters } = buildRdsStatement(query, params);

      const result = await client.send(
        new ExecuteStatementCommand({
          resourceArn: config.rdsResourceArn,
          secretArn: config.rdsSecretArn,
          database: config.rdsDatabase,
          sql,
          parameters,
        }),
      );

      const rows = mapRdsRecordsToRows<T>(result.records, result.columnMetadata);

      console.log(
        "[Database] Org-scoped query via AWS RDS Data API executed successfully:",
        {
          organizationId,
          rowCount: rows.length,
        },
      );

      return {
        rows,
        rowCount: rows.length,
      };
    } catch (error) {
      console.error(
        "[Database] Org-scoped query via AWS RDS Data API execution failed:",
        {
          organizationId,
          error: error instanceof Error ? error.message : "Unknown error",
          query: query.substring(0, 100),
          params:
            params.length > 0 ? `[${params.length} parameters]` : "no parameters",
        },
      );

      throw new Error(
        `Database query failed for organization ${organizationId} (AWS RDS): ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  // Neon per-organization connection
  const sqlClient = getNeonClientForConnectionString(config.connectionString);

  try {
    console.log("[Database] Executing org-scoped query:", {
      organizationId,
      query: query.substring(0, 100),
      paramCount: params.length,
    });

    const result = await sqlClient.query(query, params);

    const resultRows: T[] = Array.isArray(result) ? (result as T[]) : [];

    console.log("[Database] Org-scoped query executed successfully:", {
      organizationId,
      rowCount: resultRows.length,
    });

    return {
      rows: resultRows,
      rowCount: resultRows.length,
    };
  } catch (error) {
    console.error("[Database] Org-scoped query execution failed:", {
      organizationId,
      error: error instanceof Error ? error.message : "Unknown error",
      query: query.substring(0, 100),
      params: params.length > 0 ? `[${params.length} parameters]` : "no parameters",
    });

    throw new Error(
      `Database query failed for organization ${organizationId}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Test database connection
 * 
 * We only care that a simple query succeeds and returns at least one row.
 * The exact shape/type of the `test` column can vary (string/number),
 * so we normalize it before checking.
 * 
 * @returns True if connection is successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log("[Database] Testing connection with SELECT 1 query...");
    const result = await executeQuery("SELECT 1 as test");

    console.log("[Database] Query result:", {
      rowCount: result.rowCount,
      rows: result.rows,
      firstRowType: typeof result.rows[0],
      testValueType: result.rows[0] ? typeof result.rows[0].test : 'undefined',
      testValue: result.rows[0]?.test
    });

    if (!result.rows.length) {
      console.warn("[Database] No rows returned from test query");
      return false;
    }

    const value = (result.rows[0] as any).test;
    console.log("[Database] Raw test value:", value, "type:", typeof value);
    
    // Handle different possible return types from Neon
    let num: number;
    if (typeof value === "number") {
      num = value;
    } else if (typeof value === "string") {
      // Try to parse string as number
      const parsed = Number(value);
      if (Number.isNaN(parsed)) {
        console.warn("[Database] Could not convert string test value to number:", value);
        return false;
      }
      num = parsed;
    } else if (value && typeof value.toString === "function") {
      // Try to convert any object with toString to number
      const parsed = Number(value.toString());
      if (Number.isNaN(parsed)) {
        console.warn("[Database] Could not convert object test value to number:", value);
        return false;
      }
      num = parsed;
    } else {
      console.warn("[Database] Unexpected test value type:", typeof value, value);
      return false;
    }

    if (Number.isNaN(num)) {
      console.warn("[Database] Test value is NaN after conversion");
      return false;
    }

    const isSuccess = num === 1;
    console.log("[Database] Connection test result:", isSuccess, "value:", num);
    return isSuccess;
  } catch (error) {
    console.error("[Database] Connection test failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

/**
 * Simple connection test that only checks if a query executes successfully
 * without validating the return value
 */
export async function testSimpleConnection(): Promise<boolean> {
  try {
    console.log("[Database] Testing simple connection...");
    const result = await executeQuery("SELECT 1");
    
    const success = result.rowCount > 0;
    console.log("[Database] Simple connection test result:", success, "rows:", result.rowCount);
    return success;
  } catch (error) {
    console.error("[Database] Simple connection test failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

