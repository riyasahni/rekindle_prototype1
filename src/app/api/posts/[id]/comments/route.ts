import { NextResponse } from "next/server";
import { isValidDisplayName, isValidGuestSessionId, normalizeDisplayName } from "@/lib/guest";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id: postId } = await context.params;
  const body = (await request.json()) as {
    sessionId?: string;
    displayName?: string;
    text?: string;
  };
  const sessionId = String(body.sessionId ?? "").trim();
  const displayName = normalizeDisplayName(String(body.displayName ?? ""));
  const text = String(body.text ?? "").trim();

  if (!isValidGuestSessionId(sessionId)) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }
  if (!isValidDisplayName(String(body.displayName ?? ""))) {
    return NextResponse.json({ error: "Enter a name (1–64 characters)" }, { status: 400 });
  }
  if (!text || text.length > 2000) {
    return NextResponse.json({ error: "Comment required (max 2000 chars)" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { board: true },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (post.board.locked) {
    return NextResponse.json({ error: "Board is locked" }, { status: 403 });
  }

  const comment = await prisma.comment.create({
    data: { postId, sessionId, displayName, text },
  });

  return NextResponse.json({ comment });
}
