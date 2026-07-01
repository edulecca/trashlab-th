/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `Bill` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bill" DROP COLUMN "fileUrl",
ADD COLUMN     "file" BYTEA;
