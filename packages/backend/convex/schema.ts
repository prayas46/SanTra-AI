import { Organization, PhoneNumber } from "@clerk/backend";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  widgetSettings: defineTable({
    organizationId: v.string(),
    greetMessage: v.string(),
    defaultSuggestions: v.object ({
      suggestion1: v.optional(v.string()),
      suggestion2: v.optional(v.string()),
      suggestion3: v.optional(v.string()),
    }),
    vapiSettings: v.object({
      assistantId: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      workflowId: v.optional(v.string()),
    }),
  })
 .index("by_organization_id", ["organizationId"]),

  plugins: defineTable({
    organizationId: v.string(),
    service: v.union(
      v.literal("vapi"),
      v.literal("voice_nav"),
      v.literal("database"),
    ),
    secretName: v.string(),
  })
  .index("by_organization_id", ["organizationId"])
  .index("by_organization_id_and_service", ["organizationId", "service"]),
  conversations: defineTable({
  threadId: v.string(),
  organizationId: v.string(),
  contactSessionId: v.id("contactSessions"),
  status: v.union(
    v.literal("unresolved"),
    v.literal("escalated"),
    v.literal("resolved")
  ),
})
.index("by_organization_id", ["organizationId"])
.index("by_contact_session_id", ["contactSessionId"])
.index("by_thread_id", ["threadId"])
.index("by_status_and_organization_id", ["status", "organizationId"]),


  contactSessions: defineTable({
     name: v.string(),
     email: v.string(),
     organizationId: v.string(),
     expiresAt: v.number(),
     metadata: v.optional(v.object({
      userAgent: v.optional(v.string()),
      language:  v.optional(v.string()),
      preferredLanguage: v.optional(v.string()),
      languages: v.optional(v.string()),
      platform:  v.optional(v.string()),
      vendor:  v.optional(v.string()),
      screenResolution:  v.optional(v.string()),
      viewportSize: v.optional(v.string()),     
       timezone:  v.optional(v.string()),
      timeOffset: v.optional(v.number()),
      cookieEnabled: v.optional(v.boolean()),
      referrer: v.optional(v.string()),
      currentUrl: v.optional(v.string()),
  }))
   
})
.index("by_organization_id", ["organizationId"])
.index("by_expires_at", ["expiresAt"]),

users: defineTable({
  name: v.string(),
}),

  voiceNavConfigs: defineTable({
    organizationId: v.string(),
    apiBaseUrl: v.optional(v.string()),
    auth: v.optional(
      v.object({
        type: v.union(v.literal("none"), v.literal("api_key_header")),
        headerName: v.optional(v.string()),
      })
    ),
    actions: v.optional(
      v.array(
        v.object({
          name: v.string(),
          label: v.optional(v.string()),
          description: v.optional(v.string()),
          type: v.union(v.literal("front_end"), v.literal("rest_api")),
          clientEvent: v.optional(v.string()),
          method: v.optional(v.string()),
          path: v.optional(v.string()),
          queryParamsTemplate: v.optional(v.any()),
          bodyTemplate: v.optional(v.any()),
        })
      )
    ),
    languages: v.optional(v.array(v.string())),
    defaultGreeting: v.optional(v.string()),
  }).index("by_organization_id", ["organizationId"]),

});
