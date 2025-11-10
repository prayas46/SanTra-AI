import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Translation cache table schema (add this to your schema.ts):
// translations: defineTable({
//   originalText: v.string(),
//   sourceLang: v.string(),
//   targetLang: v.string(),
//   translatedText: v.string(),
//   provider: v.union(v.literal("openai"), v.literal("google"), v.literal("manual")),
//   confidence: v.optional(v.number()),
// })
// .index("by_text_and_langs", ["originalText", "sourceLang", "targetLang"]),

// Store a translation in cache
export const cacheTranslation = mutation({
  args: {
    originalText: v.string(),
    sourceLang: v.string(),
    targetLang: v.string(),
    translatedText: v.string(),
    provider: v.union(v.literal("openai"), v.literal("google"), v.literal("manual")),
    confidence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if translation already exists
    const existing = await ctx.db
      .query("translations")
      .withIndex("by_text_and_langs", (q) =>
        q
          .eq("originalText", args.originalText)
          .eq("sourceLang", args.sourceLang)
          .eq("targetLang", args.targetLang)
      )
      .first();

    if (existing) {
      // Update existing translation if confidence is higher
      if (args.confidence && (!existing.confidence || args.confidence > existing.confidence)) {
        await ctx.db.patch(existing._id, {
          translatedText: args.translatedText,
          provider: args.provider,
          confidence: args.confidence,
        });
      }
      return existing._id;
    }

    // Insert new translation
    return await ctx.db.insert("translations", args);
  },
});

// Get cached translation
export const getCachedTranslation = query({
  args: {
    originalText: v.string(),
    sourceLang: v.string(),
    targetLang: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("translations")
      .withIndex("by_text_and_langs", (q) =>
        q
          .eq("originalText", args.originalText)
          .eq("sourceLang", args.sourceLang)
          .eq("targetLang", args.targetLang)
      )
      .first();
  },
});

// Bulk translate messages
export const bulkTranslate = mutation({
  args: {
    messages: v.array(v.object({
      text: v.string(),
      sourceLang: v.string(),
      targetLang: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const message of args.messages) {
      // Check cache first
      const cached = await ctx.db
        .query("translations")
        .withIndex("by_text_and_langs", (q) =>
          q
            .eq("originalText", message.text)
            .eq("sourceLang", message.sourceLang)
            .eq("targetLang", message.targetLang)
        )
        .first();

      if (cached) {
        results.push({
          originalText: message.text,
          translatedText: cached.translatedText,
          fromCache: true,
        });
      } else {
        // Translation will be done on the client side using API
        results.push({
          originalText: message.text,
          translatedText: null,
          fromCache: false,
        });
      }
    }
    
    return results;
  },
});

// Store user language preference
export const setUserLanguage = mutation({
  args: {
    organizationId: v.string(),
    sessionId: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("contactSessions")
      .withIndex("by_organization_id")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        metadata: {
          ...session.metadata,
          preferredLanguage: args.language,
        },
      });
    }
    
    return { success: true };
  },
});

// Detect language from text (simplified version)
export const detectLanguage = query({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const { text } = args;
    
    // Simple heuristic-based detection for Hindi and Bengali
    // In production, you'd use a proper language detection API
    
    // Check for Devanagari script (Hindi)
    if (/[\u0900-\u097F]/.test(text)) {
      return { language: "hi", confidence: 0.9 };
    }
    
    // Check for Bengali script
    if (/[\u0980-\u09FF]/.test(text)) {
      return { language: "bn", confidence: 0.9 };
    }
    
    // Default to English
    return { language: "en", confidence: 0.7 };
  },
});

// Get conversation with translations
export const getTranslatedConversation = query({
  args: {
    conversationId: v.id("conversations"),
    targetLanguage: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    // Get messages (you'll need to adapt this to your message schema)
    // const messages = await ctx.db
    //   .query("messages")
    //   .withIndex("by_conversation_id")
    //   .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
    //   .collect();

    // For each message, get translation from cache
    // const translatedMessages = await Promise.all(
    //   messages.map(async (message) => {
    //     const translation = await ctx.db
    //       .query("translations")
    //       .withIndex("by_text_and_langs", (q) =>
    //         q
    //           .eq("originalText", message.content)
    //           .eq("sourceLang", message.detectedLanguage || "en")
    //           .eq("targetLang", args.targetLanguage)
    //       )
    //       .first();

    //     return {
    //       ...message,
    //       translatedContent: translation?.translatedText,
    //     };
    //   })
    // );

    return {
      conversation,
      // messages: translatedMessages,
    };
  },
});