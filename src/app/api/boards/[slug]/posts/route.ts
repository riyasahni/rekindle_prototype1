import { NextResponse } from "next/server";
import { isValidDisplayName, isValidGuestSessionId, normalizeDisplayName } from "@/lib/guest";
import { prisma } from "@/lib/prisma";
import { storePostImage } from "@/lib/store-post-image";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;
  const board = await prisma.board.findUnique({ where: { slug } });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }
  const posts = await prisma.post.findMany({
    where: { boardId: board.id },
    orderBy: { createdAt: "desc" },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
      clusterRun: true,
    },
  });
  return NextResponse.json({
    locked: board.locked,
    posts,
  });
}

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const board = await prisma.board.findUnique({ where: { slug } });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }
  if (board.locked) {
    return NextResponse.json({ error: "Board is locked" }, { status: 403 });
  }

  const form = await request.formData();
  const sessionId = String(form.get("sessionId") ?? "").trim();
  const displayNameRaw = String(form.get("displayName") ?? "");
  const displayName = normalizeDisplayName(displayNameRaw);
  const description = String(form.get("description") ?? "").trim();
  const file = form.get("image");

  if (!isValidGuestSessionId(sessionId)) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }
  if (!isValidDisplayName(displayNameRaw)) {
    return NextResponse.json({ error: "Enter a name (1–64 characters)" }, { status: 400 });
  }
  if (!description || description.length > 8000) {
    return NextResponse.json(
      { error: "Description required (max 8000 chars)" },
      { status: 400 },
    );
  }
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Image required" }, { status: 400 });
  }
  const maxBytes = process.env.BLOB_READ_WRITE_TOKEN ? 8 * 1024 * 1024 : 2 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json(
      {
        error: process.env.BLOB_READ_WRITE_TOKEN
          ? "Image too large (max 8MB)"
          : "Image too large (max 2MB without BLOB_READ_WRITE_TOKEN — add Blob or use a smaller image)",
      },
      { status: 400 },
    );
  }

  const existing = await prisma.post.findUnique({
    where: {
      boardId_sessionId: { boardId: board.id, sessionId },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already posted on this board (one per phone)." },
      { status: 409 },
    );
  }

  let imageUrl: string;
  try {
    imageUrl = await storePostImage(board.id, sessionId, file);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not store image";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      boardId: board.id,
      sessionId,
      displayName,
      imageUrl,
      description,
    },
    include: { comments: true },
  });

  return NextResponse.json({ post });
}
