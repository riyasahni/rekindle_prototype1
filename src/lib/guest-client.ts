"use client";

import { v4 as uuidv4 } from "uuid";

export const SESSION_KEY = "rekindle_session_id";

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
