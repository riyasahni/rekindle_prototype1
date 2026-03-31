import { NextResponse } from "next/server";
import { hashHostSecret } from "@/lib/board-host";
import { prisma } from "@/lib/prisma";
import { isValidSlug, normalizeSlug } from "@/lib/slug";

export const runtime = "nodejs";

function getSetupSecret(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return null;
}

const hostSecretMissing = () =>
  NextResponse.json(
    {
      error:
        "HOST_SECRET is not set on the server. Add it in Vercel → Project → Settings → Environment Variables (same name: HOST_SECRET), then redeploy. For local dev, set it in .env",
    },
    { status: 503 },
  );

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: Request) {
  const expected = process.env.HOST_SECRET;
  if (!expected) return hostSecretMissing();
  const secret = getSetupSecret(request);
  if (secret !== expected) return unauthorized();

  const boards = await prisma.board.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, name: true, locked: true, createdAt: true },
  });
  return NextResponse.json({ boards });
}

export async function POST(request: Request) {
  const expected = process.env.HOST_SECRET;
  if (!expected) {
    return hostSecretMissing();
  }

  const body = (await request.json()) as {
    setupSecret?: string;
    name?: string;
    slug?: string;
    hostPassword?: string;
  };
  if (body.setupSecret !== expected) {
    return unauthorized();
  }

  const name = body.name?.trim();
  const slug = normalizeSlug(body.slug ?? "");
  const hostPassword = body.hostPassword;

  if (!name || name.length > 120) {
    return NextResponse.json({ error: "Name required (max 120 chars)" }, { status: 400 });
  }
  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "Slug must be 2+ chars: lowercase letters, numbers, hyphens only" },
      { status: 400 },
    );
  }
  if (!hostPassword || hostPassword.length < 8) {
    return NextResponse.json(
      { error: "Host password required (min 8 chars) — use it to lock & cluster" },
      { status: 400 },
    );
  }

  const taken = await prisma.board.findUnique({ where: { slug } });
  if (taken) {
    return NextResponse.json({ error: "That slug is already taken" }, { status: 409 });
  }

  const hostSecretHash = await hashHostSecret(hostPassword);
  const board = await prisma.board.create({
    data: {
      name,
      slug,
      hostSecretHash,
    },
    select: { id: true, slug: true, name: true },
  });

  return NextResponse.json({ board });
}
