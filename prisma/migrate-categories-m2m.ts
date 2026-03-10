/**
 * CATEGORY M2M MIGRATION SCRIPT
 *
 * Run this BEFORE applying the schema change that removes Product.categoryId.
 *
 * Steps:
 *  1. Run this script:  npx ts-node --project tsconfig.json prisma/migrate-categories-m2m.ts
 *  2. Push the new schema:  npx prisma db push
 *
 * What it does: reads existing Product.categoryId values and inserts rows into
 * Prisma's implicit join table `_CategoryToProduct`. After the schema push,
 * those relationships become the M2M connections.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Migrating Product.categoryId → M2M _CategoryToProduct …");

  // Step 1: Create the join table if it doesn't exist yet
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "_CategoryToProduct" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL
    )
  `;

  await prisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS "_CategoryToProduct_AB_unique"
      ON "_CategoryToProduct"("A", "B")
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "_CategoryToProduct_B_index"
      ON "_CategoryToProduct"("B")
  `;

  // Step 2: Add FK constraints (best-effort — could fail if already exist)
  try {
    await prisma.$executeRaw`
      ALTER TABLE "_CategoryToProduct"
        ADD CONSTRAINT "_CategoryToProduct_A_fkey"
        FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `;
  } catch {
    // constraint already exists — OK
  }
  try {
    await prisma.$executeRaw`
      ALTER TABLE "_CategoryToProduct"
        ADD CONSTRAINT "_CategoryToProduct_B_fkey"
        FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `;
  } catch {
    // constraint already exists — OK
  }

  // Step 3: Copy existing categoryId data into the join table
  const migrated = await prisma.$executeRaw`
    INSERT INTO "_CategoryToProduct" ("A", "B")
    SELECT "categoryId", "id"
    FROM "Product"
    WHERE "categoryId" IS NOT NULL
    ON CONFLICT DO NOTHING
  `;

  console.log(`✓ Migrated ${migrated} product–category relationships.`);
  console.log("You can now run: npx prisma db push");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
    