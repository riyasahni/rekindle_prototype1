"use client";

import { v4 as uuidv4 } from "uuid";

export const SESSION_KEY = "rekindle_session_id";

/** Stable per-device, per-board display label — no name form. */
export function getOrCreateDisplayName(slug: string): string {
  const key = `rekindle_display_${slug}`;
  let name = localStorage.getItem(key)?.trim();
  if (!name) {
    const id = getOrCreateSessionId().replace(/-/g, "");
    const short = id.slice(0, 4);
    name = `Guest ${short}`;
    localStorage.setItem(key, name);
  }
  return name;
}

export function nameStorageKey(slug: string): string {
  return `rekindle_name_${slug}`;
}

export function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getJoinName(slug: string): string | null {
  const v = localStorage.getItem(nameStorageKey(slug));
  return v?.trim() ? v.trim() : null;
}

export function setJoinName(slug: string, name: string): void {
  localStorage.setItem(nameStorageKey(slug), name.trim());
}
