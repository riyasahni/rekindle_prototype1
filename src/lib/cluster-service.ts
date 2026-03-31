import { kmeans } from "ml-kmeans";
import OpenAI from "openai";
import { embedTexts } from "@/lib/embeddings";
import { prisma } from "@/lib/prisma";

function pickK(n: number): number {
  if (n <= 1) return 1;
  const raw = Math.round(Math.sqrt(n / 2));
  return Math.min(Math.max(raw, 2), Math.min(12, n));
}

/** Clamps host-provided k; defaults to heuristic when omitted. */
export function resolveClusterK(n: number, manual?: number): number {
  if (n <= 0) return 1;
  const maxK = Math.min(12, n);
  if (n === 1) return 1;
  const auto = pickK(n);
  if (manual == null || Number.isNaN(manual)) return Math.min(auto, maxK);
  return Math.min(Math.max(Math.round(manual), 1), maxK);
}

type ClusterLabels = Record<string, string>;

async function labelClusters(
  assignments: { postId: string; description: string; clusterId: number }[],
  k: number,
): Promise<ClusterLabels> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return {};
  const openai = new OpenAI({ apiKey: key });
  const byCluster = new Map<number, string[]>();
  for (const a of assignments) {
    const list = byCluster.get(a.clusterId) ?? [];
    if (list.length < 6) list.push(a.description);
    byCluster.set(a.clusterId, list);
  }
  const payload = Object.fromEntries(
    [...byCluster.entries()].map(([i, texts]) => [String(i), texts]),
  );
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You label discussion clusters. Return ONLY valid JSON: an object mapping cluster index strings (\"0\",\"1\",...) to a short human label (3-6 words) describing what those posts have in common. No markdown.",
      },
      {
        role: "user",
        content: JSON.stringify({ k, clusters: payload }),
      },
    ],
    temperature: 0.4,
  });
  const text = res.choices[0]?.message?.content?.trim() ?? "{}";
  try {
    const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")) as ClusterLabels;
    return parsed;
  } catch {
    return {};
  }
}

function mergeLabels(
  generated: ClusterLabels,
  overrides?: Record<string, string> | null,
): ClusterLabels {
  const out = { ...generated };
  if (!overrides) return out;
  for (const [key, val] of Object.entries(overrides)) {
    const t = val?.trim();
    if (t) out[key] = t;
  }
  return out;
}

export async function runClustering(
  boardId: string,
  opts?: { k?: number; labelOverrides?: Record<string, string> | null },
): Promise<{
  runId: string;
  k: number;
  postCount: number;
}> {
  const posts = await prisma.post.findMany({
    where: { boardId },
    orderBy: { createdAt: "asc" },
    select: { id: true, description: true },
  });
  if (posts.length === 0) {
    throw new Error("No posts to cluster");
  }
  const texts = posts.map((p) => p.description.trim() || "(empty)");
  const vectors = await embedTexts(texts);
  const k = resolveClusterK(posts.length, opts?.k);
  const data = vectors.map((v) => [...v]);
  const result = kmeans(data, k, { initialization: "kmeans++", maxIterations: 200 });
  const clusterIds = Array.from(result.clusters) as number[];
  const assignments = posts.map((p, i) => ({
    postId: p.id,
    description: p.description,
    clusterId: clusterIds[i] ?? 0,
  }));
  const generated = await labelClusters(assignments, k);
  const labels = mergeLabels(generated, opts?.labelOverrides ?? undefined);
  const run = await prisma.$transaction(async (tx) => {
    const clusterRun = await tx.clusterRun.create({
      data: {
        boardId,
        k,
        clusterLabels: labels,
      },
    });
    for (let i = 0; i < posts.length; i++) {
      await tx.post.update({
        where: { id: posts[i].id },
        data: {
          clusterId: clusterIds[i] ?? 0,
          clusterRunId: clusterRun.id,
        },
      });
    }
    return clusterRun;
  });
  return { runId: run.id, k, postCount: posts.length };
}
