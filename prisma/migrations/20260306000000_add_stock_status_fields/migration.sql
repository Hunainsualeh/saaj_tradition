-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "stockStatus" "StockStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN "lowStockThreshold" INTEGER,
ADD COLUMN "showLowStockWarning" BOOLEAN NOT NULL DEFAULT false;
