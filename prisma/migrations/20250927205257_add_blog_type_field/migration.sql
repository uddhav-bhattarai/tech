-- CreateEnum
CREATE TYPE "public"."BlogType" AS ENUM ('BLOG', 'REVIEW', 'DESCRIPTION');

-- AlterTable
ALTER TABLE "public"."blog_posts" ADD COLUMN     "blogType" "public"."BlogType" NOT NULL DEFAULT 'BLOG';
