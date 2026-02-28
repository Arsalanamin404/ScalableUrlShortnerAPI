/*
  Warnings:

  - The primary key for the `Url` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Url` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "Url_expiresAt_idx";

-- DropIndex
DROP INDEX "Url_shortCode_idx";

-- AlterTable
ALTER TABLE "Url" DROP CONSTRAINT "Url_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "Url_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "Url_shortCode_expiresAt_idx" ON "Url"("shortCode", "expiresAt");
