/*
  Warnings:

  - A unique constraint covering the columns `[name,categoryId,deletedAt]` on the table `PaymentMethod` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."PaymentMethod_name_categoryId_key";

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_name_categoryId_deletedAt_key" ON "public"."PaymentMethod"("name", "categoryId", "deletedAt");
