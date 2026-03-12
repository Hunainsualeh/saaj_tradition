import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating feature cards in the database...');

  await prisma.siteContent.updateMany({
    where: { key: 'feature_card_1_title' },
    data: { value: 'Mastered Craft' },
  });
  await prisma.siteContent.updateMany({
    where: { key: 'feature_card_1_description' },
    data: { value: 'Uncompromising quality sourced from the heart of tradition. Built to last; designed to be felt.' },
  });

  await prisma.siteContent.updateMany({
    where: { key: 'feature_card_2_title' },
    data: { value: 'Uncompromising Excellence' },
  });
  await prisma.siteContent.updateMany({
    where: { key: 'feature_card_2_description' },
    data: { value: 'Every piece in the Saaj collection is a hallmark of grace and durability. We ensure that every garment reflects a standard of quality that feels as timeless as the traditions it represents.' },
  });

  await prisma.siteContent.updateMany({
    where: { key: 'feature_card_3_title' },
    data: { value: 'Designed to Impress' },
  });
  await prisma.siteContent.updateMany({
    where: { key: 'feature_card_3_description' },
    data: { value: 'Our products feature sleek designs and modern aesthetics, making them a stylish addition to any wardrobe.' },
  });

  console.log('Feature cards updated successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });