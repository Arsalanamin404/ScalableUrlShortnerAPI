/*
  Warnings:

  - You are about to drop the column `total_clicks` on the `UrlStats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UrlStats" DROP COLUMN "total_clicks",
ADD COLUMN     "totalClicks" INTEGER NOT NULL DEFAULT 0;
