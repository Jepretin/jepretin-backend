/*
  Warnings:

  - The values [REFUND,WITHDRAW] on the enum `WalletTransactionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CUSTOMER_PAYMENT', 'WITHDRAWAL_PAYOUT', 'REFUND');

-- AlterEnum
BEGIN;
CREATE TYPE "WalletTransactionType_new" AS ENUM ('CREDIT', 'DEBIT');
ALTER TABLE "WalletTransaction" ALTER COLUMN "type" TYPE "WalletTransactionType_new" USING ("type"::text::"WalletTransactionType_new");
ALTER TYPE "WalletTransactionType" RENAME TO "WalletTransactionType_old";
ALTER TYPE "WalletTransactionType_new" RENAME TO "WalletTransactionType";
DROP TYPE "WalletTransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "netAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paymentType" "PaymentType" NOT NULL DEFAULT 'CUSTOMER_PAYMENT',
ADD COLUMN     "platformFee" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "paymentId" TEXT;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
