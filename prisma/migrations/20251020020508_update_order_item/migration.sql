/*
  Warnings:

  - You are about to drop the column `toppingId` on the `OrderItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."OrderItem" DROP CONSTRAINT "OrderItem_toppingId_fkey";

-- DropIndex
DROP INDEX "public"."OrderItem_toppingId_idx";

-- AlterTable
ALTER TABLE "public"."OrderItem" DROP COLUMN "toppingId";
