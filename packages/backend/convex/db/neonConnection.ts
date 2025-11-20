/**
 * Neon PostgreSQL Database Connection
 * 
 * Provides secure connections to Neon PostgreSQL database using the
 * HTTP-based `neon` client. This avoids WebSocket requirements that
 * are not available in Convex function runtimes.
 */

import { neon } from "@neondatabase/serverless";

/**
 * Cached Neon SQL client instance.
 * Initialized lazily to avoid issues during Convex function imports.
 */
let neonSql: ReturnType<typeof neon> | null = null;

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

