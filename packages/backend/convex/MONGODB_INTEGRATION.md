# MongoDB Integration for RAG System

This document explains how to integrate your local MongoDB medical database with the RAG (Retrieval-Augmented Generation) system.

## Overview

The MongoDB integration allows you to:
- Connect to your local MongoDB `medicalDB` database
- Sync medical data from all collections to the RAG system
- Search medical information using natural language queries
- Access patient, doctor, appointment, prescription, and billing data through AI

## Database Structure

Your `medicalDB` database contains the following collections:
- **patients** - Patient records and medical history
- **doctors** - Doctor profiles and specializations  
- **appointments** - Scheduled appointments and visits
- **prescriptions** - Medication prescriptions
- **bilings** - Billing and payment records

## Setup

### 1. MongoDB Connection

The system is configured to connect to:
- **Host**: localhost:27017
- **Database**: medicalDB
- **Authentication**: None (local development)

### 2. Sync Data to RAG

1. Navigate to the Integrations page in your web app
2. Use the "MongoDB Medical Database Sync" card
3. Click "Refresh Stats" to see current database statistics
4. Click "Sync to RAG System" to import all medical data

### 3. Search Medical Data

Once synced, you can search medical information using natural language:

**Examples:**
- "Show me patient John Smith's appointments"
- "What doctors are available for cardiology?"
- "Find all prescriptions for diabetes medication"
- "List today's appointments"
- "Show billing information for patient ID 123"

## API Endpoints

### Public Endpoints

- `api.public.mongoSync.syncMongoData` - Sync MongoDB data to RAG
- `api.public.mongoSync.getMongoStats` - Get database statistics
- `api.public.testMongoConnection.testConnection` - Test MongoDB connection

### Internal Endpoints

- `internal.private.mongoSync.syncMongoDataToRAG` - Internal sync function
- `internal.private.mongoSync.getMongoCollectionStats` - Internal stats function
- `internal.private.testMongoConnection.testMongoConnection` - Internal test function

## AI Tools

The system includes a specialized `mongoSearch` tool that:
- Searches specifically in MongoDB-synced data
- Provides medical context and professional responses
- Filters results by medical database source
- Handles medical terminology appropriately

## Data Processing

When syncing data, the system:
1. Connects to MongoDB and retrieves all documents
2. Formats data into searchable text with medical context
3. Creates embeddings using OpenAI's text-embedding-3-small model
4. Stores in the RAG system with metadata indicating MongoDB source
5. Enables semantic search across all medical data

## Security Considerations

- MongoDB connection is local-only (localhost:27017)
- No authentication required for local development
- Data is synced to organization-specific namespaces in RAG
- Medical data access is controlled by organization permissions

## Troubleshooting

### Connection Issues
- Ensure MongoDB is running on localhost:27017
- Verify the `medicalDB` database exists
- Check that collections contain data

### Sync Issues
- Check organization permissions
- Verify RAG system is properly configured
- Review console logs for detailed error messages

### Search Issues
- Ensure data has been synced successfully
- Check that queries are specific to medical data
- Verify AI agent has access to mongoSearch tool

## File Structure

```
packages/backend/convex/
├── lib/
│   └── mongodb.ts              # MongoDB connection and types
├── private/
│   ├── mongoSync.ts            # Internal sync functions
│   └── testMongoConnection.ts  # Connection testing
├── public/
│   ├── mongoSync.ts            # Public sync API
│   └── testMongoConnection.ts  # Public test API
└── system/ai/
    └── tools/
        └── mongoSearch.ts      # AI search tool
```

## Usage Examples

### Sync All Collections
```typescript
const result = await syncMongoData({});
```

### Sync Specific Collections
```typescript
const result = await syncMongoData({
    collections: ["patients", "doctors"]
});
```

### Get Database Statistics
```typescript
const stats = await getMongoStats({});
```

### Test Connection
```typescript
const test = await testConnection({});
```
