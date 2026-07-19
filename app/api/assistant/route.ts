import { NextResponse } from "next/server";
import { detectIntent } from "@/lib/assistant/intent";
import { buildAssistantResponse } from "@/lib/assistant/response-builder";
import { findProduct, loadProductKnowledgeBase } from "@/lib/assistant/product-search";
import type { ChatContext } from "@/lib/assistant/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimited(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > 30;
}

function cleanMessage(value: unknown) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, 500);
}

function cleanContext(value: unknown): ChatContext {
  const raw = (value || {}) as ChatContext;
  return {
    activeProductId: typeof raw.activeProductId === "string" ? raw.activeProductId.slice(0, 80) : undefined,
    activeProductName: typeof raw.activeProductName === "string" ? raw.activeProductName.slice(0, 160) : undefined,
    lastIntent: raw.lastIntent,
    failedAttempts: Math.max(0, Math.min(2, Number(raw.failedAttempts) || 0)),
  };
}

export async function POST(request: Request) {
  if (rateLimited(request)) {
    return NextResponse.json({ reply: "Түр хүлээгээд дахин асуугаарай.", context: {}, matchedProduct: false }, { status: 429 });
  }

  let body: { message?: unknown; context?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reply: "Асуултын формат буруу байна.", context: {}, matchedProduct: false }, { status: 400 });
  }

  const message = cleanMessage(body.message);
  const context = cleanContext(body.context);
  if (!message) {
    return NextResponse.json({ reply: "Асуултаа бичнэ үү.", context, matchedProduct: false }, { status: 400 });
  }

  const intent = detectIntent(message);
  const products = await loadProductKnowledgeBase();
  const product = findProduct(message, products, context.activeProductId);
  const answer = buildAssistantResponse(message, intent, product, context);

  return NextResponse.json(answer, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
