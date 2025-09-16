/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `OtpToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OtpToken_userId_key" ON "public"."OtpToken"("userId");
