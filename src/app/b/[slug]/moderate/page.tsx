"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function ModeratePage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const [hostPassword, setHostPassword] = useState("");
  const [clusterK, setClusterK] = useState("");
  const [labelOverridesJson, setLabelOverridesJson] = useState("");
  const [hostBusy, setHostBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !slug) return;
    const saved = localStorage.getItem(`rekindle_host_${slug}`);
    if (saved) setHostPassword(saved);
  }, [slug]);

  const runCluster = useCallback(async () => {
    if (!slug) return;
    localStorage.setItem(`rekindle_host_${slug}`, hostPassword);
    let labelOverrides: Record<string, string> | undefined;
    if (labelOverridesJson.trim()) {
      try {
        labelOverrides = JSON.parse(labelOverridesJson) as Record<string, string>;
      } catch {
        setError("Custom labels must be valid JSON.");
        return;
      }
    }
    const kRaw = clusterK.trim();
    const kParsed = kRaw ? parseInt(kRaw, 10) : undefined;
    const k = kParsed !== undefined && Number.isFinite(kParsed) ? kParsed : undefined;

    setHostBusy(true);
    setError(null);
    setOkMsg(null);
    const res = await fetch(`/api/boards/${encodeURIComponent(slug)}/cluster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostPassword,
        ...(k !== undefined ? { k } : {}),
        ...(labelOverrides ? { labelOverrides } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setHostBusy(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Clustering failed");
      return;
    }
    setOkMsg("Clustering finished. Participants can open “My group color” on the board.");
  }, [slug, hostPassword, clusterK, labelOverridesJson]);

  if (!slug) return null;

  return (
    <div className="min-h-full bg-gradient-to-b from-violet-50/90 to-white text-zinc-900">
      <header className="border-b border-violet-200/60 bg-white/80 px-4 py-6">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={() => router.push(`/b/${encodeURIComponent(slug)}`)}
            className="text-sm text-violet-700 underline"
          >
            ← Back to board
          </button>
          <h1 className="mt-3 text-2xl font-semibold">Moderator</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Enter the host password you chose when creating this board, then run{" "}
            <strong>Cluster</strong>. That closes posting and groups people by caption similarity.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {okMsg && (
          <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
            {okMsg}
          </div>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Host password</span>
          <input
            type="password"
            value={hostPassword}
            onChange={(e) => setHostPassword(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2"
            autoComplete="off"
          />
        </label>

        <button
          type="button"
          disabled={hostBusy || !hostPassword.trim()}
          onClick={runCluster}
          className="mt-6 w-full rounded-xl bg-violet-700 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-800 disabled:opacity-50"
        >
          {hostBusy ? "Working…" : "Cluster"}
        </button>

        <details className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
          <summary className="cursor-pointer font-medium text-zinc-700">Advanced</summary>
          <div className="mt-4 grid gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-zinc-600">Number of groups (optional)</span>
              <input
                type="number"
                min={1}
                max={12}
                placeholder="Auto"
                value={clusterK}
                onChange={(e) => setClusterK(e.target.value)}
                className="rounded-lg border border-zinc-200 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-zinc-600">Custom labels (optional JSON)</span>
              <textarea
                value={labelOverridesJson}
                onChange={(e) => setLabelOverridesJson(e.target.value)}
                rows={3}
                className="rounded-lg border border-zinc-200 px-3 py-2 font-mono text-xs"
                placeholder='{"0":"Party friends","1":"Support"}'
              />
            </label>
          </div>
        </details>

        <p className="mt-8 text-center text-sm text-zinc-500">
          <Link href={`/b/${encodeURIComponent(slug)}`} className="text-violet-700 underline">
            Participant board
          </Link>
        </p>
      </main>
    </div>
  );
}
