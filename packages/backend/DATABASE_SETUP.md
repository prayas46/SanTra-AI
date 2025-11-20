# Neon PostgreSQL Database Integration Setup

This document explains how to set up and use the Neon PostgreSQL database integration with your SanTra-AI RAG system.

## 🎯 Overview

The system now supports **dual data sources** for the AI agent:

1. **Neon PostgreSQL Database** - User-specific, real-time data (tickets, orders, customers)
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

## 📝 Usage Examples

### Example 1: User-Specific Query (Database Priority)

**User:** "What are my recent support tickets?"

**Flow:**

1. Agent calls `databaseQueryTool`
2. Tool queries Neon: `SELECT * FROM tickets WHERE user_id = ? AND organization_id = ?`
3. Finds tickets → Returns formatted list
4. Knowledge base is **not queried** because DB has results

**Response:**

```
Found 2 ticket(s) in the database. Recent tickets:
#tick_1: Login issue (open)
#tick_2: Billing question (resolved)
```

---

### Example 2: General Query (Knowledge Base)

**User:** "How do I reset my password?"

**Flow:**

1. Agent calls `searchTool` (recognizes this is general, not user-specific)
2. Tool queries knowledge base via RAG
3. Returns documentation-based answer

**Response:**

```
To reset your password:
1. Go to the login page
2. Click "Forgot Password"
3. Enter your email address
4. Check your inbox for the reset link (valid for 24 hours)
```

---

### Example 3: Database Empty, Knowledge Base Fallback

**User:** "What are my tickets?"

**Flow:**

1. Agent calls `databaseQueryTool`
2. Tool queries Neon: No tickets found for this user
3. Tool queries knowledge base: Finds documentation about tickets
4. Interprets KB results with `SEARCH_INTERPRETER_PROMPT`

**Response:**

```
I don't have any specific tickets on file for your account. However, I can help you create a new support ticket. Would you like to do that?
```

---

### Example 4: Both Empty

**User:** "What's my order status for ORD-999?"

**Flow:**

1. Agent calls `databaseQueryTool`
2. Tool queries Neon: No order found
3. Tool queries knowledge base: No relevant docs

**Response:**

```
I couldn't find any matching information in either the database or the knowledge base for this question. Would you like me to connect you with a human support agent?
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

## 🛠️ Customization

### Adding New Query Types

To add support for a new table (e.g., `invoices`):

1. **Update `db/types.ts`:**

   ```typescript
   export interface Invoice {
     id: string;
     user_id: string;
     organization_id: string;
     invoice_number: string;
     // ... other fields
   }
   ```

2. **Add query function in `db/queries.ts`:**

   ```typescript
   export async function queryUserInvoices(
     userId: string,
     organizationId: string
   ): Promise<QueryResult<Invoice>> {
     const sql = `
       SELECT * FROM invoices
       WHERE user_id = $1 AND organization_id = $2
       ORDER BY created_at DESC
       LIMIT 50
     `;
     return executeQuery<Invoice>(sql, [userId, organizationId]);
   }
   ```

3. **Update `inferQueryType()` in `databaseQueryTool.ts`:**

   ```typescript
   function inferQueryType(
     question: string
   ): "tickets" | "orders" | "invoices" | "search" {
     const q = question.toLowerCase();
     if (q.includes("invoice") || q.includes("bill")) {
       return "invoices";
     }
     // ... existing logic
   }
   ```

4. **Update `formatAnswer()` to handle invoices**

---

## 📊 Monitoring & Debugging

### Check Connection Status

Run from Convex Dashboard:

```
system/db/testConnection:test
```

### View Query Logs

All database queries log to console:

```
[Database] Query execution failed: { error: "...", query: "SELECT ..." }
[DatabaseQueryTool] Database query failed
[DatabaseQueryTool] Knowledge base search failed
```

### Common Issues

**"DATABASE_URL environment variable is not set"**

- Run: `npx convex env set DATABASE_URL "postgresql://..."`
- Restart Convex dev server

**"Connection refused"**

- Check Neon database is running
- Verify connection string is correct
- Check firewall/network settings

**"No results found"**

- Check that tables exist: `\dt` in psql
- Verify test data was inserted
- Check `organizationId` matches data in DB

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
