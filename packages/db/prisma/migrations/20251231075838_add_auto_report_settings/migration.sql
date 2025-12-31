-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "autoReportsEnabled" BOOLEAN DEFAULT true,
ADD COLUMN     "lastReportGeneratedAt" TIMESTAMP(3);
