/**
 * Database Query Functions
 * 
 * Type-safe, parameterized queries to Neon PostgreSQL database.
 * All queries are multi-tenant and filtered by organizationId.
 */

import { executeQuery } from "./neonConnection";
import { QueryParams, QueryResult, Ticket, Order, Customer } from "./types";

/**
 * Query support tickets for a specific user within an organization.
 * 
 * @param userId - ID of the user
 * @param organizationId - ID of the organization (multi-tenant isolation)
 */
export async function queryUserTickets(
  userId: string,
  organizationId: string
): Promise<QueryResult<Ticket>> {
  const sql = `
    SELECT id, user_id, organization_id, title, description, status, priority,
           created_at, updated_at, resolved_at
    FROM tickets
    WHERE user_id = $1 AND organization_id = $2
    ORDER BY created_at DESC
    LIMIT 50
  `;

  const result = await executeQuery<Ticket>(sql, [userId, organizationId]);

  return {
    rows: result.rows.map((row) => normalizeTicket(row)),
    rowCount: result.rowCount,
  };
}

/**
 * Query orders for a specific user within an organization.
 * 
 * @param userId - ID of the user
 * @param organizationId - ID of the organization (multi-tenant isolation)
 */
export async function queryOrders(
  userId: string,
  organizationId: string
): Promise<QueryResult<Order>> {
  const sql = `
    SELECT id, user_id, organization_id, order_number, status,
           total_amount, currency, created_at, updated_at
    FROM orders
    WHERE user_id = $1 AND organization_id = $2
    ORDER BY created_at DESC
    LIMIT 50
  `;

  const result = await executeQuery<Order>(sql, [userId, organizationId]);

  return {
    rows: result.rows.map((row) => normalizeOrder(row)),
    rowCount: result.rowCount,
  };
}

/**
 * Search across tickets, orders, and customers by search term.
 * 
 * This is a generic search function that the AI agent can use
 * when it doesn't know the exact table to query.
 */
export async function searchRecords(
  searchTerm: string,
  organizationId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<QueryResult<any>> {
  const limit = Math.min(options.limit ?? 50, 100);
  const offset = options.offset ?? 0;
  const term = `%${searchTerm.toLowerCase()}%`;

  const sql = `
    SELECT 'ticket' AS record_type,
           t.id,
           t.user_id,
           t.organization_id,
           t.title,
           t.description,
           t.status,
           t.priority,
           t.created_at,
           t.updated_at,
           t.resolved_at
    FROM tickets t
    WHERE t.organization_id = $1
      AND (
        LOWER(t.title) LIKE $2 OR
        LOWER(t.description) LIKE $2
      )

    UNION ALL

    SELECT 'order' AS record_type,
           o.id,
           o.user_id,
           o.organization_id,
           o.order_number AS title,
           NULL AS description,
           o.status,
           NULL AS priority,
           o.created_at,
           o.updated_at,
           NULL AS resolved_at
    FROM orders o
    WHERE o.organization_id = $1
      AND (
        LOWER(o.order_number) LIKE $2
      )

    UNION ALL

    SELECT 'customer' AS record_type,
           c.id,
           NULL AS user_id,
           c.organization_id,
           c.name AS title,
           c.email AS description,
           NULL AS status,
           NULL AS priority,
           c.created_at,
           c.updated_at,
           NULL AS resolved_at
    FROM customers c
    WHERE c.organization_id = $1
      AND (
        LOWER(c.name) LIKE $2 OR
        LOWER(c.email) LIKE $2
      )

    ORDER BY created_at DESC
    LIMIT $3 OFFSET $4
  `;

  const result = await executeQuery<any>(sql, [organizationId, term, limit, offset]);

  return {
    rows: result.rows,
    rowCount: result.rowCount,
  };
}

/**
 * Normalize raw ticket row into Ticket type.
 */
function normalizeTicket(row: any): Ticket {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    organization_id: String(row.organization_id),
    title: String(row.title),
    description: String(row.description ?? ""),
    status: row.status,
    priority: row.priority,
    created_at: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
    resolved_at: row.resolved_at
      ? row.resolved_at instanceof Date
        ? row.resolved_at
        : new Date(row.resolved_at)
      : undefined,
  };
}

/**
 * Normalize raw order row into Order type.
 */
function normalizeOrder(row: any): Order {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    organization_id: String(row.organization_id),
    order_number: String(row.order_number),
    status: row.status,
    total_amount: typeof row.total_amount === "number"
      ? row.total_amount
      : Number(row.total_amount ?? 0),
    currency: String(row.currency),
    created_at: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
  };
}

/**
 * Helper to determine if any database results are available.
 */
export function hasDatabaseResults(result: QueryResult<any> | null | undefined): boolean {
  if (!result) return false;
  return Array.isArray(result.rows) && result.rows.length > 0;
}
