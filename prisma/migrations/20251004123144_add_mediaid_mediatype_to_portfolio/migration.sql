-- AlterTable
ALTER TABLE "public"."ProviderPortfolio" ADD COLUMN     "mediaId" TEXT,
ADD COLUMN     "mediaType" TEXT NOT NULL DEFAULT 'image';
