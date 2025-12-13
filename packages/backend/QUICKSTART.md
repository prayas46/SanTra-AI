# 🚀 Quick Start: Neon PostgreSQL Integration

Get your database integration up and running in 5 minutes.

## ✅ What's Already Done

All code files have been created:
- ✅ Database connection helper (`convex/db/neonConnection.ts`)
- ✅ Type-safe query functions (`convex/db/queries.ts`)
- ✅ TypeScript types (`convex/db/types.ts`)
- ✅ Database query tool (`convex/system/ai/tools/databaseQueryTool.ts`)
- ✅ Updated chat API (`convex/public/messages.ts`)
- ✅ Connection test action (`convex/system/db/testConnection.ts`)
- ✅ SQL schema (`database-schema.sql`)
- ✅ Package installed (`@neondatabase/serverless`)

## 🎯 What You Need To Do

### Step 1: Set Environment Variable (2 minutes)

**Local Development:**

Add to `.env.local` in project root:
```bash
DATABASE_URL=postgresql://neondb_owner:npg_aL0hEmtJ1dwg@ep-purple-forest-ah2ty3hr-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Convex Cloud:**

Run this command:
```bash
npx convex env set DATABASE_URL "postgresql://neondb_owner:npg_aL0hEmtJ1dwg@ep-purple-forest-ah2ty3hr-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Step 2: Start Convex Dev Server (1 minute)

```bash
pnpm --filter @workspace/backend dev
```

Wait for Convex to sync all functions.

### Step 3: Test Connection (1 minute)

1. Open Convex Dashboard (link shown in terminal)
2. Go to **Functions** tab
3. Find `system/db/testConnection:test`
4. Click **Run**

✅ Success response:
```json
{
  "success": true,
  "message": "✅ Successfully connected to Neon PostgreSQL database"
}
```

❌ If it fails:
- Check DATABASE_URL is set correctly
- Verify Neon database is active
- Restart Convex dev server

### Step 4: Create Database Schema (1 minute)

**Option A - Neon SQL Editor (Recommended):**
1. Go to [Neon Console](https://console.neon.tech)
2. Open SQL Editor
3. Copy-paste contents of `packages/backend/database-schema.sql`
4. Click **Run**

**Option B - Using psql:**
```bash
psql "postgresql://neondb_owner:npg_aL0hEmtJ1dwg@ep-purple-forest-ah2ty3hr-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require" -f packages/backend/database-schema.sql
```

This creates tables and inserts test data.

### Step 5: Test the Integration (optional)

Ask the AI agent a test question through your chat widget:

**Test 1 - Database Query:**
```
"What are my recent support tickets?"
```

**Test 2 - Knowledge Base Query:**
```
"How do I reset my password?"
```

**Test 3 - Empty Response:**
```
"What are my orders?"
```
(Should say no orders found)

---

## 🎉 You're Done!

Your AI agent now has access to both:
- 🗄️ **Neon PostgreSQL** - for user-specific data
- 📚 **Knowledge Base (RAG)** - for general documentation

### How It Works

```
User: "What are my tickets?"
    ↓
AI Agent calls databaseQueryTool
    ↓
Queries Database + Knowledge Base (parallel)
    ↓
Priority: Database results first
    ↓
Returns: "Found 1 ticket: Login issue (open)"
```

---

## 🔍 Next Steps

1. **Add your own data** to the database (replace test data)
2. **Customize queries** in `convex/db/queries.ts`
3. **Add more tables** (see DATABASE_SETUP.md for guide)
4. **Monitor queries** in Convex logs

---

## 📖 Full Documentation

See `DATABASE_SETUP.md` for:
- Detailed architecture
- Security features
- Customization guide
- Troubleshooting
- API reference

---

## 🆘 Troubleshooting

**"DATABASE_URL is not set"**
```bash
# Check if set
npx convex env get DATABASE_URL

# Set it
npx convex env set DATABASE_URL "postgresql://..."
```

**"Connection refused"**
- Check Neon database is active in console
- Verify connection string has no typos
- Try connection test again

**"Table doesn't exist"**
- Run the schema SQL in Neon SQL Editor
- Verify tables created: `SELECT * FROM tickets;`

**Agent doesn't use database**
- Check Convex logs for errors
- Verify DATABASE_URL is set
- Test connection action should pass

---

## 💡 Tips

- Database queries are **multi-tenant** by default
- All queries use **parameterized SQL** (no injection risk)
- Connection pooling is **automatic**
- DATABASE_URL is **never exposed** to browser

---

**Need help?** Check `DATABASE_SETUP.md` or Convex logs for detailed error messages.
