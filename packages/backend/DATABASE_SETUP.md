# Neon PostgreSQL Database Integration Setup

This document explains how to set up and use the Neon PostgreSQL database integration with your SanTra-AI RAG system.

## 🎯 Overview

The system now supports **dual data sources** for the AI agent:

1. **PostgreSQL Database (Neon by default, per-organization)** - User-specific, real-time data (tickets, orders, customers, medical records)
2. **Knowledge Base (RAG)** - General documentation and FAQs

### Priority Rules

The AI agent follows these strict priority rules:

1. **Database First**: Always queries the database first for user-specific questions
2. **Database Has Results**: If database returns data, uses ONLY database results
3. **Database Empty**: Falls back to knowledge base if database has no results
4. **Both Empty**: Clearly states no information was found

### Parallel Execution

Both data sources are queried **in parallel** for optimal performance using `Promise.all()`.

---

## 📦 Installation

The required dependencies have already been installed:

```bash
pnpm add @neondatabase/serverless
```

---

## 🔧 Environment Configuration

### Step 1: Add DATABASE_URL to Local Development

Add to your `.env.local` file in the project root:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_aL0hEmtJ1dwg@ep-purple-forest-ah2ty3hr-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Step 2: Add DATABASE_URL to Convex Cloud

From your project root, run:

```bash
npx convex env set DATABASE_URL "postgresql://neondb_owner:npg_aL0hEmtJ1dwg@ep-purple-forest-ah2ty3hr-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

This stores the URL as a **server-side secret** that's never exposed to the browser.

### Step 3: Verify Connection

1. Start your Convex dev server:

   ```bash
   pnpm --filter @workspace/backend dev
   ```

2. Go to your Convex Dashboard → Functions

3. Find and run `system/db/testConnection:test`

4. You should see:
   ```json
   {
     "success": true,
     "message": "✅ Successfully connected to Neon PostgreSQL database",
     "details": {
       "connectionTime": "123ms",
       "databaseUrl": "postgresql://neondb_owner..."
     }
   }
   ```

---

## 🧩 Modular Per-Organization Database Connections

In addition to the legacy global `DATABASE_URL`, the system now supports **per-organization database connections**.
These are configured via the **Dashboard → Database** page and stored securely in AWS Secrets Manager.

### How it works

- Each organization has an optional secret in AWS Secrets Manager named:
  - `tenant/{organizationId}/database`
- The secret value is a JSON object. The exact fields depend on the provider:
  - **Neon / other Postgres over HTTP**
    - `{ "provider": "neon" | "other_postgres", "connectionString": "postgresql://..." }`
  - **AWS Aurora Serverless (RDS Data API)**
    - `{ "provider": "aws_rds", "rdsResourceArn": "...", "rdsSecretArn": "...", "rdsDatabase": "your_db", "awsRegion"?: "region-1" }`
- At runtime, Convex uses this per-org secret (via `executeOrgQuery`) to talk to the database.
- If no per-org secret is found, or the provider is not supported, the system falls back to the global `DATABASE_URL`.

### Database dashboard workflow

1. Go to **Dashboard → Database** (route: `/database`).
2. Click **Connect Database** and enter your connection string.
3. Click **Test connection** to verify the configured per-org database.
4. (Optional) Use **Database inspection** to:
   - Load the list of public tables.
   - Preview sample rows for a selected table.
5. (Optional) Use **RAG ingestion from database** to ingest rows from all public tables into the organization RAG namespace.

---

## 🔄 RAG Integration with Database

### RAG Configuration

The system now includes a robust RAG (Retrieval-Augmented Generation) system with the following features:

1. **Dual Namespace Support**:
   - Organization-specific namespace (using `organizationId`)
   - Global namespace (fallback when organization-specific data isn't found)

2. **Pagination Support**:
   - All database queries support pagination with `limit` and `offset`
   - Default page size: 20 items
   - Maximum page size: 100 items

3. **Dynamic Table Discovery**:
   - Automatically discovers and queries any public table in the database
   - No code changes needed when new tables are added

### RAG Ingestion Process

To ingest data into the RAG system:

```typescript
// Ingest data from Neon to RAG
const result = await ctx.runAction(internal.system.db.ingestNeonToRag.ingest, {
  organizationId: "your-org-id",
});
```

This will:

1. Discover all public tables in the database
2. Ingest their contents into the RAG system
3. Make them searchable through the natural language interface

### Querying with RAG

To query the database through RAG, use the `databaseQueryTool` with natural language:

```typescript
// Example query
const results = await databaseQueryTool({
  query: "Show me all patients with high blood pressure",
  page: 1,
  pageSize: 20,
});
```

## 🔍 Query Types and Examples

The system supports the following query types automatically:

1. **Specific Table Queries**:
   - Doctors: `queryDoctors()`
   - Patients: `queryPatients()`
   - Appointments: `queryAppointments()`
   - Medications: `queryMedications()`
   - Lab Results: `queryLabResults()`
   - Medical Records: `queryMedicalRecords()`

2. **Dynamic Table Queries**:
   - Automatically detects and queries any public table
   - Example: `queryTable('your_table_name')`

3. **Search Across Tables**:
   - Full-text search across all tables
   - Example: `searchRecords('search term')`

## 📊 Example Queries

```typescript
const results = await databaseQueryTool({
  query: "Show me all patients with high blood pressure",
  page: 1,
  pageSize: 20,
});
```

## 🗄️ Database Schema Setup

### Step 1: Connect to Neon

Use the Neon SQL Editor or any PostgreSQL client (like `psql`, TablePlus, DBeaver).

### Step 2: Run Schema Creation

Execute the SQL in `packages/backend/database-schema.sql`:

```bash
# Using psql
psql "postgresql://neondb_owner:npg_aL0hEmtJ1dwg@ep-purple-forest-ah2ty3hr-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require" -f packages/backend/database-schema.sql
```

Or copy-paste the SQL into Neon's SQL Editor.

This creates:

- `organizations` table
- `customers` table
- `tickets` table
- `orders` table
- Sample test data

---

## 🚀 How It Works

### File Structure

```
packages/backend/convex/
├── db/
│   ├── neonConnection.ts      # Connection pooling & query execution
│   ├── queries.ts              # Type-safe SQL query functions
│   └── types.ts                # TypeScript type definitions
├── system/
│   └── ai/
│       ├── agents/
│       │   ├── supportAgent.ts  # Main support agent (updated)
│       │   └── ragAgent.ts      # Optional RAG + DB wrapper
│       ├── tools/
│       │   ├── databaseQueryTool.ts  # NEW: Combined DB + KB tool
│       │   ├── search.ts             # Existing KB search
│       │   ├── escalateConversation.ts
│       │   └── resolveConversation.ts
│       └── constants.ts          # Updated with new tool instructions
└── public/
    └── messages.ts              # Chat API (updated with databaseQueryTool)
```

### Data Flow

```
User Question
    ↓
supportAgent.generateText()
    ↓
    ├─→ databaseQueryTool (for user-specific questions)
    │   ├─→ Query Neon PostgreSQL ─────┐
    │   └─→ Query Knowledge Base (RAG) ─┤ (parallel)
    │                                   ↓
    │   Priority Logic:
    │   • DB has results? → Use DB only
    │   • DB empty, KB has results? → Use KB (with interpreter)
    │   • Both empty? → "No data found"
    │
    ├─→ searchTool (for general questions)
    │   └─→ Query Knowledge Base (RAG)
    │
    ├─→ escalateConversationTool
    └─→ resolveConversationTool
```

---

## 🔒 Security Features

### ✅ What's Secure

- **DATABASE_URL never exposed to client** - stored server-side only
- **Parameterized queries** - all SQL uses `$1, $2, ...` placeholders
- **Multi-tenant isolation** - all queries filtered by `organizationId`
- **No SQL injection** - uses `@neondatabase/serverless` parameterized queries
- **Connection pooling** - prevents connection exhaustion

### ✅ Multi-Tenancy

Every database query includes:

```typescript
WHERE organization_id = $1 AND user_id = $2
```

This ensures users can only see their own data within their organization.

In the modular model, per-organization secrets live at `tenant/{organizationId}/database` and are only read inside Convex actions.

---

## 🧪 Testing

### Test Case 1: Database-Only

```typescript
// Scenario: DB has data, KB is empty
const result = await databaseQueryTool.handler(ctx, {
  query: "What are my recent support tickets?",
});

// Expected: Returns DB results, doesn't query KB
expect(result).toContain("ticket");
expect(result).toContain("Login issue");
```

### Test Case 2: Knowledge-Base-Only

```typescript
// Scenario: DB is empty, KB has data
const result = await databaseQueryTool.handler(ctx, {
  query: "How do I reset my password?",
});

// Expected: Falls back to KB
expect(result).toContain("reset your password");
expect(result).not.toContain("ticket"); // No DB mentions
```

### Test Case 3: Both Sources

```typescript
// Scenario: Both DB and KB have data
const result = await databaseQueryTool.handler(ctx, {
  query: "What are my tickets?",
});

// Expected: Prioritizes DB, may ignore KB entirely
expect(result).toContain("Found");
expect(result).toContain("ticket");
```

---

## 🧱 Provider Options & Limitations

- **Supported in Convex runtime today:**
  - `provider = "neon"` with a Neon HTTP connection string.
  - `provider = "aws_rds"` targeting **Aurora Serverless Postgres with the RDS Data API enabled**.
- **Config-only (falls back to global `DATABASE_URL`):**
  - `provider = "other_postgres"` is stored in the secret and visible in the UI, but Convex will still use the Neon/global connection until a dedicated driver is added.
- **Fallback behavior:**
  - If a per-org secret is missing or the provider is not recognized, database queries fall back to the global `DATABASE_URL`.

In other words, you can actively use **Neon** and **Aurora Serverless (AWS RDS Data API)** today. Other providers are configuration-only for now.

## 🧾 Aurora Serverless (AWS RDS Data API) Setup Checklist

1. **Create Aurora Serverless PostgreSQL cluster**
   - Engine: Aurora PostgreSQL-Compatible, Serverless capacity, **Data API enabled**.
   - Note the **cluster ARN** (used as `rdsResourceArn` / “Aurora RDS resource ARN” in the Dashboard).

2. **Create an AWS Secrets Manager secret for DB credentials**
   - Secret type: “Credentials for RDS database”, pointing to your Aurora cluster.
   - Note the **secret ARN** (used as `rdsSecretArn` / “RDS DB secret ARN” in the Dashboard).

3. **Configure IAM + environment for Convex backend**
   - IAM principal used by Convex must be allowed to call:
     - `rds-data:ExecuteStatement` (and optionally `rds-data:BatchExecuteStatement`) on the cluster ARN.
     - `secretsmanager:GetSecretValue` on the DB credentials secret ARN.
   - Set environment variables:
     - `AWS_ACCESS_KEY_ID`
     - `AWS_SECRET_ACCESS_KEY`
     - `AWS_REGION` (must match the region of your Aurora cluster and credentials secret).

4. **Configure the database in Dashboard → Database**
   - Provider: **AWS RDS (Postgres)**.
   - **Aurora RDS resource ARN** = Aurora cluster ARN from step 1.
   - **RDS DB secret ARN** = DB credentials secret ARN from step 2.
   - **Database name** = logical database inside Aurora (for example `santra`).
   - Click **Connect**, then **Test connection** to verify the Data API path.

5. **Inspect and ingest data**
   - Use **Load tables** / **Preview** to confirm tables and sample rows.
   - Use **Ingest to RAG** to pull data from Aurora into the organization’s RAG namespace.

---

## 🎯 Success Checklist

- ✅ `@neondatabase/serverless` package installed
- ✅ `DATABASE_URL` set in Convex environment
- ✅ Database schema created in Neon
- ✅ Connection test passes
- ✅ Sample data inserted
- ✅ Agent can query both database and knowledge base
- ✅ Database priority works correctly
- ✅ Multi-tenant isolation verified

---

## 📚 API Reference

### `executeQuery<T>(query: string, params: any[])`

Execute parameterized SQL query.

```typescript
const result = await executeQuery<Ticket>(
  "SELECT * FROM tickets WHERE user_id = $1",
  [userId]
);
// result: { rows: Ticket[], rowCount: number }
```

### `queryUserTickets(userId: string, organizationId: string)`

Get all tickets for a user within an organization.

### `queryOrders(userId: string, organizationId: string)`

Get all orders for a user within an organization.

### `searchRecords(searchTerm: string, organizationId: string, options)`

Generic search across tickets, orders, and customers.

---

## 🆘 Support

For issues or questions:

1. Check the connection test action results
2. Review console logs for error messages
3. Verify environment variables are set correctly
4. Check Neon dashboard for database status

---

## 📖 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Convex Actions](https://docs.convex.dev/functions/actions)
- [@neondatabase/serverless](https://github.com/neondatabase/serverless)
- [Convex Environment Variables](https://docs.convex.dev/production/environment-variables)
