import { NextResponse } from "next/server";
import { clusterIndexToCss, clusterIndexToHex } from "@/lib/cluster-colors";
import { isValidGuestSessionId } from "@/lib/guest";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId")?.trim();
  const boardSlug = searchParams.get("boardSlug")?.trim();

  if (!sessionId || !isValidGuestSessionId(sessionId)) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  if (!boardSlug) {
    return NextResponse.json({ error: "boardSlug required" }, { status: 400 });
  }

  const board = await prisma.board.findUnique({ where: { slug: boardSlug } });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  const post = await prisma.post.findFirst({
    where: { sessionId, boardId: board.id },
    orderBy: { createdAt: "desc" },
    include: { clusterRun: true },
  });

  if (!post) {
    return NextResponse.json({
      hasPost: false,
      clusterReady: false,
    });
  }

  if (post.clusterId == null || !post.clusterRun) {
    return NextResponse.json({
      hasPost: true,
      clusterReady: false,
      description: post.description,
    });
  }

  const k = post.clusterRun.k;
  const labels = post.clusterRun.clusterLabels as Record<string, string> | null;
  const label =
    labels?.[String(post.clusterId)] ??
    labels?.[post.clusterId] ??
    `Cluster ${post.clusterId + 1}`;

  const css = clusterIndexToCss(k, post.clusterId);
  const hex = clusterIndexToHex(k, post.clusterId);

  return NextResponse.json({
    hasPost: true,
    clusterReady: true,
    clusterId: post.clusterId,
    k,
    label,
    colorCss: css,
    colorHex: hex,
    description: post.description,
  });
}
