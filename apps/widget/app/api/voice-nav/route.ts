import { NextRequest, NextResponse } from "next/server";
import { api } from "@workspace/backend/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
const client = new ConvexHttpClient(convexUrl);

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin":
    process.env.NEXT_PUBLIC_WIDGET_ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function withCors(response: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId, text, language } = await req.json();

    if (!organizationId || !text) {
      return withCors(
        NextResponse.json(
          { error: "organizationId and text are required" },
          { status: 400 }
        )
      );
    }

    const interpretArgs: {
      organizationId: string;
      text: string;
      language?: string;
    } = {
      organizationId,
      text,
    };

    if (typeof language === "string" && language.trim().length > 0) {
      interpretArgs.language = language;
    }

    const interpretResult = await client.action(
      api.public.voiceNav.interpret,
      interpretArgs
    );

    let executeResult: any = null;

    const safeActions = Array.isArray(interpretResult.actions)
      ? interpretResult.actions.filter(
          (action: any) =>
            action && typeof action === "object" && typeof action.type === "string"
        )
      : [];

    if (safeActions.length > 0) {
      executeResult = await client.action(api.public.voiceNav.execute, {
        organizationId,
        actions: safeActions,
      });
    }

    return withCors(
      NextResponse.json({
        interpret: interpretResult,
        execute: executeResult,
      })
    );
  } catch (error: any) {
    console.error("/api/voice-nav error", error);
    return withCors(
      NextResponse.json(
        { error: error?.message || "Internal Server Error" },
        { status: 500 }
      )
    );
  }
}
