/*
  Warnings:

  - The values [PENDING] on the enum `WalletTransactionType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[name,deletedAt]` on the table `PaymentCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."WalletTransactionType_new" AS ENUM ('CREDIT', 'DEBIT', 'REFUND', 'WITHDRAW');
ALTER TABLE "public"."WalletTransaction" ALTER COLUMN "type" TYPE "public"."WalletTransactionType_new" USING ("type"::text::"public"."WalletTransactionType_new");
ALTER TYPE "public"."WalletTransactionType" RENAME TO "WalletTransactionType_old";
ALTER TYPE "public"."WalletTransactionType_new" RENAME TO "WalletTransactionType";
DROP TYPE "public"."WalletTransactionType_old";
COMMIT;

-- DropIndex
DROP INDEX "public"."PaymentCategory_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCategory_name_deletedAt_key" ON "public"."PaymentCategory"("name", "deletedAt");
