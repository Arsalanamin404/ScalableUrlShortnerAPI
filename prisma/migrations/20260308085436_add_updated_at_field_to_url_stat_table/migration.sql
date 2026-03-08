/*
  Warnings:

  - Added the required column `updatedAt` to the `UrlStats` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UrlStats" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
