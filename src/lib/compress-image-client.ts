import imageCompression from "browser-image-compression";

/** Under 2MB server cap for inline DB storage (no Vercel Blob). */
const SAFE_UNDER_INLINE_CAP = 1.45 * 1024 * 1024;

/**
 * Shrinks phone photos before upload so typical camera / library JPEGs stay under API limits.
 * Skips work when already small enough.
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }
  if (file.size <= SAFE_UNDER_INLINE_CAP) {
    return file;
  }

  const opts = {
    maxSizeMB: 1.5 as number,
    maxWidthOrHeight: 2560,
    useWebWorker: true,
  };

  try {
    let out = await imageCompression(file, opts);
    const hardMax = 1.95 * 1024 * 1024;
    if (out.size > hardMax) {
      out = await imageCompression(out, {
        maxSizeMB: 1.2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
    }
    return out;
  } catch {
    throw new Error("Could not process this image. Try a different photo or a screenshot (JPEG/PNG).");
  }
}
