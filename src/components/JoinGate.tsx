"use client";

import { useEffect, useState } from "react";
import { getJoinName, getOrCreateSessionId, setJoinName } from "@/lib/guest-client";

export function JoinGate({
  slug,
  children,
  onJoined,
}: {
  slug: string;
  children: React.ReactNode;
  onJoined?: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJoined(Boolean(getJoinName(slug)));
    setReady(true);
  }, [slug]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = name.trim();
    if (t.length < 1 || t.length > 64) {
      setError("Enter a name between 1 and 64 characters.");
      return;
    }
    getOrCreateSessionId();
    setJoinName(slug, t);
    setError(null);
    setJoined(true);
    onJoined?.();
  }

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-100 text-zinc-500">
        Loading…
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 px-6 text-white">
        <p className="text-xs font-medium uppercase tracking-widest text-teal-400">Rekindle</p>
        <h1 className="mt-3 text-center text-2xl font-semibold">What should we call you?</h1>
        <p className="mt-2 max-w-sm text-center text-sm text-zinc-400">
          This name appears on your photo and comments. One post per phone on this board.
        </p>
        {error && (
          <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/50 px-4 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
        <form onSubmit={onSubmit} className="mt-8 w-full max-w-sm space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={64}
            autoComplete="name"
            autoFocus
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-lg text-white placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-500"
          >
            Join board
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
