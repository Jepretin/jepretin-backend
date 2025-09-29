/*
  Warnings:

  - You are about to drop the column `bankAccountName` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `bankAccountNumber` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `bankName` on the `Provider` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Provider" DROP COLUMN "bankAccountName",
DROP COLUMN "bankAccountNumber",
DROP COLUMN "bankName";

-- CreateIndex
CREATE INDEX "Village_districtId_idx" ON "public"."Village"("districtId");
