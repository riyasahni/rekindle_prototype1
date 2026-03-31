"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrCreateSessionId } from "@/lib/guest-client";

type MeResponse =
  | {
      hasPost: false;
      clusterReady?: boolean;
    }
  | {
      hasPost: true;
      clusterReady: false;
      description?: string;
    }
  | {
      hasPost: true;
      clusterReady: true;
      clusterId: number;
      k: number;
      label: string;
      colorCss: string;
      colorHex: string;
      description: string;
    };

export default function ColorSlugPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [data, setData] = useState<MeResponse | null>(null);
  const [wakeLock, setWakeLock] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    setSessionReady(true);
  }, []);

  useEffect(() => {
    if (!slug || !sessionReady) return;
    const sessionId = getOrCreateSessionId();
    let cancelled = false;
    async function poll() {
      const res = await fetch(
        `/api/me?boardSlug=${encodeURIComponent(slug)}&sessionId=${encodeURIComponent(sessionId)}`,
      );
      const json = (await res.json()) as MeResponse;
      if (!cancelled) setData(json);
    }
    poll();
    const t = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [slug, sessionReady]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !(navigator as unknown as { wakeLock?: unknown }).wakeLock) {
      return;
    }
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: string) => Promise<{ release: () => void }> };
    };
    if (!wakeLock) return;
    let lock: { release: () => void } | null = null;
    nav.wakeLock
      ?.request("screen")
      .then((l) => {
        lock = l;
      })
      .catch(() => {});
    return () => {
      lock?.release();
    };
  }, [wakeLock]);

  if (!slug || !sessionReady) {
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-900 text-white">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-900 text-white">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (!data.hasPost) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-zinc-900 p-6 text-center text-white">
        <p className="max-w-md text-sm text-zinc-300">
          Post a photo on this board first (after entering your name). This page shows your group
          color after the host runs clustering.
        </p>
        <Link
          href={`/b/${encodeURIComponent(slug)}`}
          className="rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-900"
        >
          Go to board
        </Link>
      </div>
    );
  }

  if (!data.clusterReady) {
    return (
      <div
        className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center text-white"
        style={{ backgroundColor: "#27272a" }}
      >
        <p className="max-w-md text-sm text-zinc-200">
          Clustering is not ready yet. Keep this page open — it refreshes every few seconds.
        </p>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={wakeLock}
            onChange={(e) => setWakeLock(e.target.checked)}
          />
          Keep screen on (if supported)
        </label>
        <Link href={`/b/${encodeURIComponent(slug)}`} className="text-sm underline text-zinc-300">
          Back to board
        </Link>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-full flex-col items-center justify-between p-6 text-white"
      style={{ backgroundColor: data.colorCss }}
    >
      <div className="w-full text-center">
        <p className="text-sm font-medium opacity-90 drop-shadow-sm">{data.label}</p>
        <p className="mt-1 text-xs opacity-80 drop-shadow-sm">{data.colorHex}</p>
      </div>
      <p className="max-w-sm text-center text-sm opacity-95 drop-shadow-md">
        Find others with the same full-screen color — you are in the same story cluster.
      </p>
      <div className="flex w-full flex-wrap items-center justify-center gap-3">
        <label className="flex items-center gap-2 text-xs opacity-90">
          <input
            type="checkbox"
            checked={wakeLock}
            onChange={(e) => setWakeLock(e.target.checked)}
          />
          Keep screen awake
        </label>
        <Link
          href={`/b/${encodeURIComponent(slug)}`}
          className="rounded-full bg-black/20 px-4 py-2 text-xs font-medium backdrop-blur-sm"
        >
          Board
        </Link>
      </div>
    </div>
  );
}
