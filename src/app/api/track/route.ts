import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

const eventSchema = z.object({
  pageId: z.string().min(10).max(40),
  type: z.enum(["view", "click"]),
  path: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  visitorId: z.string().max(40).optional(),
  label: z.string().max(200).nullable().optional(),
});

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Recebe os eventos do script injetado nas landing pages (sendBeacon manda text/plain).
export async function POST(req: NextRequest) {
  const parsed = eventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400, headers: CORS });
  const page = await db.page.findUnique({ where: { id: parsed.data.pageId }, select: { id: true } });
  if (page) await db.pageEvent.create({ data: parsed.data });
  return new NextResponse(null, { status: 204, headers: CORS });
}
