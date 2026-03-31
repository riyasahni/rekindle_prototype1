import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyHostSecret } from "@/lib/board-host";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const body = (await request.json()) as { hostPassword?: string };
  const board = await prisma.board.findUnique({ where: { slug } });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }
  const ok = await verifyHostSecret(board.hostSecretHash, body.hostPassword);
  if (!ok) {
    return NextResponse.json({ error: "Invalid host password" }, { status: 401 });
  }
  await prisma.board.update({
    where: { id: board.id },
    data: { locked: true },
  });
  return NextResponse.json({ ok: true, locked: true });
}
