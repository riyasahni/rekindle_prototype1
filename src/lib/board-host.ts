import bcrypt from "bcryptjs";

export async function hashHostSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyHostSecret(
  hash: string,
  plain: string | null | undefined,
): Promise<boolean> {
  if (!plain) return false;
  return bcrypt.compare(plain, hash);
}
