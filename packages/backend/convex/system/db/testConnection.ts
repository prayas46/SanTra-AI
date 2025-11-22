/**
 * Database Connection Test Action
 * 
 * This action can be called from the Convex dashboard to verify
 * that the Neon PostgreSQL database connection is working correctly.
 */

import { action } from "../../_generated/server";
import { testConnection, testSimpleConnection } from "../../db/neonConnection";

/**
 * Test the Neon database connection.
 * 
 * Usage from Convex dashboard:
 * 1. Go to your Convex dashboard
 * 2. Navigate to Functions
 * 3. Find "system/db/testConnection"
 * 4. Click "Run" with no arguments
 * 
 * @returns Connection test result with details
 */
export const test = action({
  args: {},
  handler: async () => {
    const startTime = Date.now();
    
    try {
      console.log("[TestAction] Starting database connection tests...");
      
      // Try the simple test first
      const simpleResult = await testSimpleConnection();
      const simpleTime = Date.now() - startTime;
      
      // Try the detailed test
      const detailedResult = await testConnection();
      const totalTime = Date.now() - startTime;
      
      if (detailedResult) {
        return {
          success: true,
          message: "✅ Successfully connected to Neon PostgreSQL database",
          details: {
            connectionTime: `${totalTime}ms`,
            simpleTestTime: `${simpleTime}ms`,
            detailedTestTime: `${totalTime - simpleTime}ms`,
            databaseUrlConfigured: !!process.env.DATABASE_URL,
            databaseUrlPrefix: process.env.DATABASE_URL?.split('://')[0] + '://',
            tests: {
              simple: simpleResult,
              detailed: detailedResult
            }
          },
        };
      } else if (simpleResult) {
        return {
          success: false,
          message: "⚠️ Simple connection works but detailed validation failed",
          details: {
            connectionTime: `${totalTime}ms`,
            simpleTestTime: `${simpleTime}ms`,
            detailedTestTime: `${totalTime - simpleTime}ms`,
            databaseUrlConfigured: !!process.env.DATABASE_URL,
            databaseUrlPrefix: process.env.DATABASE_URL?.split('://')[0] + '://',
            tests: {
              simple: simpleResult,
              detailed: detailedResult
            },
            recommendation: "Check the Convex function logs for detailed error information"
          },
        };
      } else {
        return {
          success: false,
          message: "❌ Both connection tests failed",
          details: {
            connectionTime: `${totalTime}ms`,
            simpleTestTime: `${simpleTime}ms`,
            detailedTestTime: `${totalTime - simpleTime}ms`,
            databaseUrl: process.env.DATABASE_URL ? "SET" : "NOT SET",
            databaseUrlPrefix: process.env.DATABASE_URL?.split('://')[0] + '://',
            tests: {
              simple: simpleResult,
              detailed: detailedResult
            },
            troubleshooting: [
              "Verify DATABASE_URL is correct in Convex environment",
              "Check if Neon database is running and accessible",
              "Ensure the connection string format is correct",
              "Check for network/firewall issues"
            ]
          },
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        message: "❌ Database connection error",
        details: {
          connectionTime: `${duration}ms`,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          databaseUrl: process.env.DATABASE_URL ? "SET" : "NOT SET",
          databaseUrlPrefix: process.env.DATABASE_URL?.split('://')[0] + '://',
        },
      };
    }
  },
});
