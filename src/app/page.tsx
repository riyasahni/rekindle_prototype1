"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { useCallback, useEffect, useState } from "react";
import { normalizeSlug } from "@/lib/slug";

type BoardRow = {
  id: string;
  slug: string;
  name: string;
  locked: boolean;
  createdAt: string;
};

export default function HomePage() {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [hostPassword, setHostPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdBoard, setCreatedBoard] = useState<{ slug: string; name: string } | null>(null);
  const [boards, setBoards] = useState<BoardRow[]>([]);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const refreshBoards = useCallback(async (secret: string) => {
    if (!secret.trim()) return;
    setListLoading(true);
    const res = await fetch("/api/boards", {
      headers: { Authorization: `Bearer ${secret.trim()}` },
    });
    setListLoading(false);
    if (!res.ok) return;
    const data = (await res.json()) as { boards: BoardRow[] };
    setBoards(data.boards);
  }, []);

  async function createBoard(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        setupSecret: setupSecret.trim(),
        name,
        slug: normalizeSlug(slug || name),
        hostPassword,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not create board");
      return;
    }
    const board = data.board as { slug: string; name: string };
    setCreatedBoard(board);
    setName("");
    setSlug("");
    setHostPassword("");
    void refreshBoards(setupSecret);
  }

  const boardUrl =
    createdBoard && origin ? `${origin}/b/${encodeURIComponent(createdBoard.slug)}` : "";
  const moderateUrl =
    createdBoard && origin
      ? `${origin}/b/${encodeURIComponent(createdBoard.slug)}/moderate`
      : "";

  return (
    <div className="min-h-full bg-gradient-to-b from-amber-50/90 via-white to-sky-50/80 text-zinc-900">
      <header className="border-b border-amber-200/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <h1 className="text-3xl font-semibold tracking-tight">Rekindle</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-600">
            Create a board, share the participant link or QR. They land straight on the board — no
            sign-in — upload a photo and caption, and see everyone’s posts update live. You use the
            separate moderator link to run <strong>Cluster</strong> when ready. No accounts.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-teal-100 bg-teal-50/40 p-6 shadow-sm">
          <h2 className="text-lg font-medium">Create a board (moderator)</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Use <code className="rounded bg-zinc-100 px-1">HOST_SECRET</code> from your server env.
            Pick a <strong>host password</strong> — you’ll need it to click <strong>Cluster</strong>{" "}
            on the board later.
          </p>
          <form onSubmit={createBoard} className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600">HOST_SECRET (from server env)</span>
              <input
                type="password"
                value={setupSecret}
                onChange={(e) => setSetupSecret(e.target.value)}
                className="rounded-lg border border-zinc-200 px-3 py-2"
                autoComplete="off"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600">Board title</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-zinc-200 px-3 py-2"
                required
                maxLength={120}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600">URL slug (optional — derived from title if empty)</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. spring-retreat"
                className="rounded-lg border border-zinc-200 px-3 py-2"
                maxLength={64}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600">Host password (min 8 chars — lock & cluster)</span>
              <input
                type="password"
                value={hostPassword}
                onChange={(e) => setHostPassword(e.target.value)}
                className="rounded-lg border border-zinc-200 px-3 py-2"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="w-fit rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create board"}
            </button>
          </form>
        </section>

        {createdBoard && boardUrl && moderateUrl && (
          <section className="mt-10 rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-medium">Share with participants</h2>
            <p className="mt-2 text-sm text-zinc-600">
              QR or link below — they go straight to the board (no password). Photo + caption; posts
              refresh every few seconds.
            </p>
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="rounded-2xl bg-white p-4 shadow-inner ring-1 ring-zinc-100">
                <QRCode value={boardUrl} size={200} level="M" />
              </div>
              <code className="break-all rounded-lg bg-zinc-100 px-3 py-2 text-left text-xs text-zinc-800">
                {boardUrl}
              </code>
              <Link
                href={`/b/${encodeURIComponent(createdBoard.slug)}`}
                className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white"
              >
                Open participant board
              </Link>
            </div>
            <div className="mt-8 border-t border-zinc-100 pt-6 text-left">
              <h3 className="text-sm font-medium text-zinc-900">Moderator only</h3>
              <p className="mt-1 text-xs text-zinc-600">
                Bookmark this — use your host password here to run Cluster (not shown to participants).
              </p>
              <code className="mt-3 block break-all rounded-lg bg-violet-50 px-3 py-2 text-xs text-zinc-800">
                {moderateUrl}
              </code>
              <Link
                href={moderateUrl}
                className="mt-3 inline-block rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-900"
              >
                Open moderator page
              </Link>
            </div>
          </section>
        )}

        <section className="mt-10 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-900">Join a board by link</h3>
          <p className="mt-1 text-xs text-zinc-600">If you have a slug from a facilitator, jump in.</p>
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const raw = String(fd.get("joinSlug") ?? "").trim();
              const s = raw.replace(/^\/+|\/+$/g, "").replace(/^b\//, "");
              if (s) router.push(`/b/${encodeURIComponent(s)}`);
            }}
          >
            <input
              name="joinSlug"
              placeholder="e.g. spring-retreat"
              className="min-w-[200px] flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Go
            </button>
          </form>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600">List boards (HOST_SECRET)</span>
              <input
                type="password"
                value={setupSecret}
                onChange={(e) => setSetupSecret(e.target.value)}
                className="min-w-[200px] rounded-lg border border-zinc-200 px-3 py-2"
                placeholder="Same as above"
              />
            </label>
            <button
              type="button"
              onClick={() => refreshBoards(setupSecret)}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm"
            >
              {listLoading ? "…" : "Refresh list"}
            </button>
          </div>
          {boards.length > 0 && (
            <ul className="mt-4 space-y-2">
              {boards.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/b/${b.slug}`}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm hover:border-teal-200"
                  >
                    <span className="font-medium">{b.name}</span>
                    <span className="text-sm text-zinc-500">/{b.slug}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
