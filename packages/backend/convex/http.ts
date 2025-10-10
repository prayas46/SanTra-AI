// packages/backend/convex/http.ts
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/backend";
import { httpAction } from "./_generated/server";
import { createClerkClient } from "@clerk/backend";

const http = httpRouter();

// Helper function to validate Clerk webhook requests.
async function validateRequest(
  request: Request,
): Promise<WebhookEvent | null> {
  const payloadString = await request.text();
  const svixHeaders = {
    "svix-id": request.headers.get("svix-id")|| "",
    "svix-timestamp": request.headers.get("svix-timestamp")||"",
    "svix-signature": request.headers.get("svix-signature")||"",
  };

  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET|| "");
  try {
    // Verify the webhook payload using Clerk's secret.
    // If verification fails, it throws an error.
    return webhook.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event:", error);
    return null;
  }
};

// Defines an HTTP route for Clerk webhooks.
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (context, request) => {
    // Validate the incoming request as a Clerk webhook event.
    const event = await validateRequest(request);

    if (!event) {
      // If the event is invalid, return a 400 response.
      return new Response("Error occurred", {
        status: 400,
      });
    }

    // Handle specific event types.
    switch (event.type) {
      case "subscription.updated":{
        // Extract subscription details.
        const subscription = event.data as {
          status: string;
          payer?: { organization_id: string } | null; 
        // organization_id can be optional
        };

        const organizationId = subscription.payer?.organization_id;

        if (!organizationId) {
          // If organizationId is missing, return an error response.
          return new Response("Missing organization ID", {
            status: 400,
          });
        }
    

        // Determine the maximum allowed memberships based on subscription status.
        const newMaxAllowedMemberships =
          subscription.status === "active" ? 5 : 1;

        // Update Clerk organization settings (e.g., allowed memberships).
        // This requires a Clerk secret key to interact with Clerk's backend API.
        const clerkClient = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY || "",
        });

        await clerkClient.organizations.updateOrganization(organizationId, {
          maxAllowedMemberships: newMaxAllowedMemberships,
        });

        // Upsert (create or update) the subscription status in Convex.
        await context.runMutation(internal.system.subscriptions.upsert, {
          organizationId: organizationId,
          status: subscription.status,
        });
        break;}
      default:
        console.log("Ignored Clerk webhook event:", event.type);
        break;
    }

    // Return a 200 response for successful processing or ignored events.
    return new Response(null, {
      status: 200,
    });
  }),
});

export default http;