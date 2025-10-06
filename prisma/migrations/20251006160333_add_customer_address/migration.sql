/*
  Warnings:

  - You are about to drop the column `addressDetail` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `districtId` on the `Order` table. All the data in the column will be lost.
  - Added the required column `addressId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_districtId_fkey";

-- DropIndex
DROP INDEX "public"."Order_districtId_idx";

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "addressDetail",
DROP COLUMN "districtId",
ADD COLUMN     "addressId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."CustomerAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "addressDetail" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerAddress_userId_idx" ON "public"."CustomerAddress"("userId");

-- CreateIndex
CREATE INDEX "CustomerAddress_districtId_idx" ON "public"."CustomerAddress"("districtId");

-- AddForeignKey
ALTER TABLE "public"."CustomerAddress" ADD CONSTRAINT "CustomerAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerAddress" ADD CONSTRAINT "CustomerAddress_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "public"."District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "public"."CustomerAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
