/*
  Warnings:

  - You are about to drop the `UserRefreshToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserRefreshToken" DROP CONSTRAINT "UserRefreshToken_userId_fkey";

-- DropTable
DROP TABLE "UserRefreshToken";
