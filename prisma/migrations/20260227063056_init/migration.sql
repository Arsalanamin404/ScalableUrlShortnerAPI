-- CreateTable
CREATE TABLE "Url" (
    "id" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "longUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Url_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Url_shortCode_key" ON "Url"("shortCode");

-- CreateIndex
CREATE INDEX "Url_shortCode_idx" ON "Url"("shortCode");

-- CreateIndex
CREATE INDEX "Url_expiresAt_idx" ON "Url"("expiresAt");
