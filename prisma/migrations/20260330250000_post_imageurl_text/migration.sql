-- Allow long data URLs when not using Vercel Blob
ALTER TABLE "Post" ALTER COLUMN "imageUrl" SET DATA TYPE TEXT;
