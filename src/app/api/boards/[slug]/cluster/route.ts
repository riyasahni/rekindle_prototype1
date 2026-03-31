import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyHostSecret } from "@/lib/board-host";
import { runClustering } from "@/lib/cluster-service";

export const runtime = "nodejs";
export const maxDuration = 120;

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const body = (await request.json()) as {
    hostPassword?: string;
    k?: number;
    labelOverrides?: Record<string, string> | null;
  };
  const board = await prisma.board.findUnique({ where: { slug } });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }
  const ok = await verifyHostSecret(board.hostSecretHash, body.hostPassword);
  if (!ok) {
    return NextResponse.json({ error: "Invalid host password" }, { status: 401 });
  }
  if (!board.locked) {
    return NextResponse.json(
      { error: "Lock the board first so everyone has finished posting." },
      { status: 400 },
    );
  }

  try {
    const result = await runClustering(board.id, {
      k: body.k,
      labelOverrides: body.labelOverrides ?? undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Clustering failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
