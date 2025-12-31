-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "heightUnit" TEXT DEFAULT 'cm',
ADD COLUMN     "temperatureUnit" TEXT DEFAULT 'celsius',
ADD COLUMN     "weightUnit" TEXT DEFAULT 'kg';
