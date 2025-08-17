/*
  Warnings:

  - You are about to drop the column `bannerUrl` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `stores` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."stores" DROP COLUMN "bannerUrl",
DROP COLUMN "logoUrl";
