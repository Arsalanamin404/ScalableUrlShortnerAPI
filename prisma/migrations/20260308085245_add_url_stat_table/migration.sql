-- CreateTable
CREATE TABLE "UrlStats" (
    "id" TEXT NOT NULL,
    "urlId" TEXT NOT NULL,
    "total_clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UrlStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UrlStats_urlId_key" ON "UrlStats"("urlId");

-- CreateIndex
CREATE INDEX "UrlStats_urlId_idx" ON "UrlStats"("urlId");

-- AddForeignKey
ALTER TABLE "UrlStats" ADD CONSTRAINT "UrlStats_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "Url"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
