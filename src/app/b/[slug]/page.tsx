"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getOrCreateDisplayName, getOrCreateSessionId } from "@/lib/guest-client";

type Comment = {
  id: string;
  sessionId: string;
  displayName: string;
  text: string;
  createdAt: string;
};

type ClusterRun = {
  id: string;
  k: number;
  clusterLabels: Record<string, string> | null;
};

type Post = {
  id: string;
  sessionId: string;
  displayName: string;
  imageUrl: string;
  description: string;
  clusterId: number | null;
  clusterRunId: string | null;
  createdAt: string;
  comments: Comment[];
  clusterRun: ClusterRun | null;
};

const POLL_MS = 2500;

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const [locked, setLocked] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [displayName, setDisplayName] = useState("");
  const [deviceSessionId, setDeviceSessionId] = useState("");

  useEffect(() => {
    if (!slug) return;
    setDisplayName(getOrCreateDisplayName(slug));
    setDeviceSessionId(getOrCreateSessionId());
  }, [slug]);

  const refresh = useCallback(async () => {
    if (!slug) return;
    const res = await fetch(`/api/boards/${encodeURIComponent(slug)}/posts`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      locked: boolean;
      posts: Post[];
    };
    setLocked(data.locked);
    setPosts(data.posts);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [slug, refresh]);

  useEffect(() => {
    if (!slug) return;
    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      void refresh();
    };
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [slug, refresh]);

  const myPost =
    deviceSessionId && displayName
      ? posts.find((p) => p.sessionId === deviceSessionId)
      : undefined;
  const canPost = Boolean(displayName) && !locked && !myPost;

  async function onSubmitPost(e: React.FormEvent) {
    e.preventDefault();
    const sid = getOrCreateSessionId();
    const name = getOrCreateDisplayName(slug);
    if (!file || !desc.trim()) return;
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append("sessionId", sid);
    fd.append("displayName", name);
    fd.append("description", desc.trim());
    fd.append("image", file);
    const res = await fetch(`/api/boards/${encodeURIComponent(slug)}/posts`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not post");
      return;
    }
    setDesc("");
    setFile(null);
    await refresh();
  }

  async function addComment(postId: string) {
    const text = (commentDrafts[postId] ?? "").trim();
    const name = getOrCreateDisplayName(slug);
    if (!text) return;
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: getOrCreateSessionId(),
        displayName: name,
        text,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Comment failed");
      return;
    }
    setCommentDrafts((m) => ({ ...m, [postId]: "" }));
    await refresh();
  }

  if (!slug) {
    return null;
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-amber-50/90 via-white to-sky-50/80 text-zinc-900">
      <header className="border-b border-amber-200/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm text-teal-700 underline"
            >
              ← Home
            </button>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Board</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Posts update every few seconds. After clustering, open{" "}
              <Link
                href={`/color/${encodeURIComponent(slug)}`}
                className="font-medium text-teal-700 underline"
              >
                your group color
              </Link>
              .
            </p>
          </div>
          <Link
            href={`/color/${encodeURIComponent(slug)}`}
            className="rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700"
          >
            My group color
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {locked && !myPost && (
          <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This board is closed to new posts (clustering has started or the moderator locked it).
          </p>
        )}

        {canPost && (
          <section className="mb-10 rounded-2xl border border-teal-100 bg-teal-50/40 p-6 shadow-sm">
            <h2 className="text-lg font-medium text-zinc-900">Add your photo</h2>
            <p className="mt-1 text-sm text-zinc-600">
              One photo per phone. You appear as <span className="font-medium">{displayName}</span>.
              We group similar stories using your caption.
            </p>
            <form onSubmit={onSubmitPost} className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600">Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600">Caption</span>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={4}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900"
                  placeholder="What’s this photo about?"
                  maxLength={8000}
                />
              </label>
              <button
                type="submit"
                disabled={submitting || !file || !desc.trim()}
                className="w-fit rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting ? "Uploading…" : "Post"}
              </button>
            </form>
          </section>
        )}

        {myPost && !canPost && (
          <p className="mb-6 text-sm text-zinc-600">
            You’ve posted.{" "}
            <Link
              href={`/color/${encodeURIComponent(slug)}`}
              className="font-medium text-teal-700 underline"
            >
              Open your group color
            </Link>{" "}
            after the moderator runs clustering.
          </p>
        )}

        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-medium text-zinc-900">Everyone’s posts</h2>
          <span className="text-xs text-zinc-400">Live refresh ~{POLL_MS / 1000}s</span>
        </div>
        {loading ? (
          <p className="text-zinc-500">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-zinc-500">No posts yet — be the first.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => {
              const label =
                post.clusterRun?.clusterLabels &&
                typeof post.clusterId === "number"
                  ? (post.clusterRun.clusterLabels[String(post.clusterId)] as string | undefined)
                  : undefined;
              return (
                <li
                  key={post.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/3] w-full bg-zinc-100">
                    <Image
                      src={post.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <p className="text-xs font-medium text-zinc-600">{post.displayName}</p>
                    <p className="text-sm leading-relaxed text-zinc-800">{post.description}</p>
                    {label && (
                      <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
                        {label}
                      </p>
                    )}
                    <div className="border-t border-zinc-100 pt-3">
                      <p className="text-xs font-medium text-zinc-500">Comments</p>
                      <ul className="mt-2 space-y-2">
                        {post.comments.map((c) => (
                          <li key={c.id} className="text-sm text-zinc-700">
                            <span className="font-medium text-zinc-500">{c.displayName}: </span>
                            {c.text}
                          </li>
                        ))}
                      </ul>
                      {!locked && displayName && (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={commentDrafts[post.id] ?? ""}
                            onChange={(e) =>
                              setCommentDrafts((m) => ({
                                ...m,
                                [post.id]: e.target.value,
                              }))
                            }
                            placeholder="Add a comment"
                            className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                            maxLength={2000}
                          />
                          <button
                            type="button"
                            onClick={() => addComment(post.id)}
                            className="shrink-0 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-800"
                          >
                            Send
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
