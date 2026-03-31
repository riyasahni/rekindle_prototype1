-- CreateTable
CREATE TABLE "BoardState" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "locked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BoardState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClusterRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "k" INTEGER NOT NULL,
    "clusterLabels" JSONB,

    CONSTRAINT "ClusterRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "clusterId" INTEGER,
    "clusterRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Post_sessionId_idx" ON "Post"("sessionId");

-- CreateIndex
CREATE INDEX "Post_clusterRunId_idx" ON "Post"("clusterRunId");

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_clusterRunId_fkey" FOREIGN KEY ("clusterRunId") REFERENCES "ClusterRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
