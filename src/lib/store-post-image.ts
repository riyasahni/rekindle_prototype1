import { put } from "@vercel/blob";

const INLINE_MAX_BYTES = 2 * 1024 * 1024;

/** Persists image to Vercel Blob when configured; otherwise stores a data URL in Postgres (dev / no Blob). */
export async function storePostImage(
  boardId: string,
  sessionId: string,
  file: File | Blob,
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";
    const filename = `posts/${boardId}/${sessionId}-${Date.now()}.${ext}`;
    const blob = await put(filename, file, {
      access: "public",
      token,
    });
    return blob.url;
  }

  if (file.size > INLINE_MAX_BYTES) {
    throw new Error(
      `Without BLOB_READ_WRITE_TOKEN, images must be under ${INLINE_MAX_BYTES / 1024 / 1024}MB. Add a Vercel Blob token or use a smaller photo.`,
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}
