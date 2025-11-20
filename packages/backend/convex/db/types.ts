/**
 * Database Type Definitions
 * 
 * Type-safe definitions for PostgreSQL database operations.
 * Ensures consistency across database queries and agent tools.
 */

/**
 * Represents a support ticket in the database
 */
export interface Ticket {
  id: string;
  user_id: string;
  organization_id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
}

/**
 * Represents an order in the database
 */
export interface Order {
  id: string;
  user_id: string;
  organization_id: string;
  order_number: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Represents a customer in the database
 */
export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Generic database query result
 */
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

/**
 * Database query parameters with multi-tenancy support
 */
export interface QueryParams {
  organizationId: string;
  userId?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  connectionString: string;
  maxConnections?: number;
  idleTimeoutMs?: number;
}

/**
 * Unified context for database and RAG queries
 */
export interface DataSourceContext {
  database: {
    available: boolean;
    results: any[];
    source: "database";
  };
  knowledgeBase: {
    available: boolean;
    results: any[];
    source: "knowledge_base";
  };
}

/**
 * Query execution metadata
 */
export interface QueryMetadata {
  executionTime: number;
  source: "database" | "knowledge_base" | "both";
  resultCount: number;
  error?: string;
}
