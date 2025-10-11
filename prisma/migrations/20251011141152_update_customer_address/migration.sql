/*
  Warnings:

  - You are about to drop the column `districtId` on the `CustomerAddress` table. All the data in the column will be lost.
  - Added the required column `villageId` to the `CustomerAddress` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."CustomerAddress" DROP CONSTRAINT "CustomerAddress_districtId_fkey";

-- DropIndex
DROP INDEX "public"."CustomerAddress_districtId_idx";

-- AlterTable
ALTER TABLE "public"."CustomerAddress" DROP COLUMN "districtId",
ADD COLUMN     "villageId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "CustomerAddress_villageId_idx" ON "public"."CustomerAddress"("villageId");

-- AddForeignKey
ALTER TABLE "public"."CustomerAddress" ADD CONSTRAINT "CustomerAddress_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "public"."Village"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
