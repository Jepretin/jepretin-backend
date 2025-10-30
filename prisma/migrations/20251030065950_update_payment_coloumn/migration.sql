/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `methodId` on the `Payment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_methodId_fkey";

-- DropIndex
DROP INDEX "public"."Payment_categoryId_idx";

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "categoryId",
DROP COLUMN "methodId";
