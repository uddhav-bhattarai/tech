-- AlterTable
ALTER TABLE "public"."blog_posts" ADD COLUMN     "deviceId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."blog_posts" ADD CONSTRAINT "blog_posts_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
