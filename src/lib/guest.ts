const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidGuestSessionId(id: string): boolean {
  return UUID_RE.test(id);
}

export function normalizeDisplayName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, 64);
}

export function isValidDisplayName(name: string): boolean {
  const n = normalizeDisplayName(name);
  return n.length >= 1 && n.length <= 64;
}
