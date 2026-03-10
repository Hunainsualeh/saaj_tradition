/**
 * Seed script for Saaj Tradition
 * Creates collections, 25+ products, and sample orders
 *
 * Run: npx tsx prisma/seed.ts
 */

import { PrismaClient, CartStatus, OrderStatus, PaymentStatus, PaymentMethod, SizeTypeEnum } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

// ==========================================
// COLLECTIONS
// ==========================================
const COLLECTIONS = [
  {
    name: "Eid Collection",
    tagline: "Celebrate in elegance with our curated Eid designs",
    slug: "eid-collection",
    imageUrl: "/assets/prodcut/eid-collection.jpg",
    sortOrder: 1,
  },
  {
    name: "Summer Collection",
    tagline: "Light, breathable fabrics for the warm season",
    slug: "summer-collection",
    imageUrl: "/assets/prodcut/summer-collection.jpg",
    sortOrder: 2,
  },
];

// ==========================================
// PRODUCTS (25+ Pakistani boutique / female dresses)
// ==========================================
const PRODUCTS = [
  // --- DRESSES (Eid + Summer) ---
  {
    name: "Emerald Chiffon Anarkali",
    description: "A flowing emerald green chiffon anarkali with delicate thread embroidery on the bodice and sleeves. Paired with a matching dupatta featuring scalloped borders. Perfect for festive gatherings and Eid celebrations.",
    price: 189.99,
    compareAtPrice: 249.99,
    categorySlug: "dresses",
    slug: "emerald-chiffon-anarkali",
    sizeType: "Standard",
    collections: ["eid-collection"],
  },
  {
    name: "Ivory Organza Sharara Set",
    description: "An ivory organza kurta adorned with tone-on-tone embroidery, paired with flared sharara pants and a net dupatta. The subtle shimmer makes it ideal for nikah ceremonies and formal Eid dinners.",
    price: 245.00,
    compareAtPrice: 310.00,
    categorySlug: "dresses",
    slug: "ivory-organza-sharara-set",
    sizeType: "Standard",
    collections: ["eid-collection"],
  },
  {
    name: "Blush Pink Lawn Suit",
    description: "A lightweight blush pink lawn three-piece suit with minimalist floral prints. The breathable cotton fabric and relaxed silhouette make it a summer wardrobe essential.",
    price: 79.99,
    compareAtPrice: null,
    categorySlug: "dresses",
    slug: "blush-pink-lawn-suit",
    sizeType: "Standard",
    collections: ["summer-collection"],
  },
  {
    name: "Royal Blue Velvet Kurta",
    description: "A rich royal blue velvet straight-cut kurta with gold zardozi work along the neckline and cuffs. Comes with raw silk trousers and a chiffon dupatta with gold edging.",
    price: 299.00,
    compareAtPrice: 375.00,
    categorySlug: "dresses",
    slug: "royal-blue-velvet-kurta",
    sizeType: "Standard",
    collections: ["eid-collection"],
  },
  {
    name: "Sage Green Cotton Kurta",
    description: "A breezy sage green cotton kurta with white chicken kari embroidery. The relaxed A-line cut and side slits ensure comfort during warm summer days.",
    price: 65.00,
    compareAtPrice: null,
    categorySlug: "dresses",
    slug: "sage-green-cotton-kurta",
    sizeType: "Standard",
    collections: ["summer-collection"],
  },
  {
    name: "Maroon Banarasi Lehenga",
    description: "A statement maroon banarasi silk lehenga with intricate gold weaving throughout. The matching blouse features a sweetheart neckline with detailed handwork. A stunning choice for Eid festivities.",
    price: 425.00,
    compareAtPrice: 550.00,
    categorySlug: "dresses",
    slug: "maroon-banarasi-lehenga",
    sizeType: "Standard",
    collections: ["eid-collection"],
  },
  {
    name: "White Schiffli Maxi Dress",
    description: "A pristine white schiffli embroidered maxi dress with tiered layers and a cinched waist. Lightweight and feminine, perfect for summer brunches and outdoor gatherings.",
    price: 110.00,
    compareAtPrice: 145.00,
    categorySlug: "dresses",
    slug: "white-schiffli-maxi-dress",
    sizeType: "Standard",
    collections: ["summer-collection"],
  },
  {
    name: "Dusty Rose Gharara Set",
    description: "A dusty rose net gharara set with sequin spray work and pearl detailing. The voluminous gharara pants create a graceful silhouette while the short kurta keeps the look modern.",
    price: 275.00,
    compareAtPrice: 340.00,
    categorySlug: "dresses",
    slug: "dusty-rose-gharara-set",
    sizeType: "Standard",
    collections: ["eid-collection"],
  },
  {
    name: "Teal Cambric Shalwar Kameez",
    description: "A vibrant teal cambric shalwar kameez with geometric block prints and contrast burnt orange embroidery on the placket. Includes a printed chiffon dupatta.",
    price: 72.00,
    compareAtPrice: null,
    categorySlug: "dresses",
    slug: "teal-cambric-shalwar-kameez",
    sizeType: "Standard",
    collections: ["summer-collection"],
  },
  {
    name: "Gold Tissue Formal Gown",
    description: "A luxurious gold tissue fabric formal gown with structured bodice and flowing trail. Adorned with crystal and bead embellishments throughout. Designed for the most special Eid occasions.",
    price: 520.00,
    compareAtPrice: 650.00,
    categorySlug: "dresses",
    slug: "gold-tissue-formal-gown",
    sizeType: "Standard",
    collections: ["eid-collection"],
  },
  {
    name: "Lilac Jacquard A-Line Kurta",
    description: "A soft lilac jacquard kurta in A-line silhouette with subtle self-print pattern. Finished with lace trimmings at the hem and sleeves. An everyday summer staple.",
    price: 58.00,
    compareAtPrice: null,
    categorySlug: "dresses",
    slug: "lilac-jacquard-a-line-kurta",
    sizeType: "Standard",
    collections: ["summer-collection"],
  },
  {
    name: "Black Silk Peplum Dress",
    description: "A sophisticated black raw silk peplum top with silver thread work, paired with straight pants and an organza dupatta. A modern take on classic Pakistani formalwear.",
    price: 210.00,
    compareAtPrice: 270.00,
    categorySlug: "dresses",
    slug: "black-silk-peplum-dress",
    sizeType: "Standard",
    collections: ["eid-collection"],
  },
  {
    name: "Coral Printed Lawn Two-Piece",
    description: "A cheerful coral lawn two-piece with tropical botanical prints. The kurta features a mandarin collar and three-quarter sleeves. Ideal for casual summer outings.",
    price: 55.00,
    compareAtPrice: null,
    categorySlug: "dresses",
    slug: "coral-printed-lawn-two-piece",
    sizeType: "Standard",
    collections: ["summer-collection"],
  },
  {
    name: "Peach Net Angrakha",
    description: "A graceful peach net angrakha style kurta with wrap front and tassel ties. Features scattered mirror work and pearl accents. Paired with cigarette pants and a tulle dupatta.",
    price: 195.00,
    compareAtPrice: 250.00,
    categorySlug: "dresses",
    slug: "peach-net-angrakha",
    sizeType: "Standard",
    collections: ["eid-collection"],
  },
  {
    name: "Sky Blue Linen Kaftan",
    description: "An oversized sky blue linen kaftan with hand-painted floral motifs along the hem. The relaxed drape and breathable fabric make it a perfect beach-to-brunch summer piece.",
    price: 88.00,
    compareAtPrice: 115.00,
    categorySlug: "dresses",
    slug: "sky-blue-linen-kaftan",
    sizeType: "OneSize",
    collections: ["summer-collection"],
  },
  // --- TOPS & BOTTOMS ---
  {
    name: "Cream Chicken Kari Palazzo Set",
    description: "A cream chicken kari embroidered short top paired with flowing palazzo pants. The delicate hand-embroidery and soft cotton fabric offer comfort with elegance.",
    price: 95.00,
    compareAtPrice: 125.00,
    categorySlug: "tops-bottoms",
    slug: "cream-chicken-kari-palazzo",
    sizeType: "Standard",
    collections: ["summer-collection"],
  },
  {
    name: "Navy Silk Cigarette Pants",
    description: "Tailored navy blue raw silk cigarette pants with a flattering high-waist fit. Features a concealed side zip and pressed front crease. A versatile piece for formal and festive styling.",
    price: 68.00,
    compareAtPrice: null,
    categorySlug: "tops-bottoms",
    slug: "navy-silk-cigarette-pants",
    sizeType: "Standard",
    collections: ["eid-collection"],
  },
  {
    name: "Mint Embroidered Crop Top",
    description: "A fresh mint green crop top with white cutwork embroidery and a sweetheart neckline. Style it with a high-waisted gharara or palazzo for a contemporary Pakistani look.",
    price: 48.00,
    compareAtPrice: null,
    categorySlug: "tops-bottoms",
    slug: "mint-embroidered-crop-top",
    sizeType: "Standard",
    collections: ["summer-collection"],
  },
  // --- OUTERWEAR ---
  {
    name: "Champagne Velvet Shawl",
    description: "A luxurious champagne velvet shawl with delicate gold embroidered borders. The soft pile fabric and generous size provide warmth and sophistication for evening Eid gatherings.",
    price: 135.00,
    compareAtPrice: 180.00,
    categorySlug: "outerwear",
    slug: "champagne-velvet-shawl",
    sizeType: "OneSize",
    collections: ["eid-collection"],
  },
  {
    name: "Ivory Pashmina Wrap",
    description: "A fine ivory pashmina wrap with hand-embroidered floral corners. Lightweight enough for summer evenings yet elegant enough for formal occasions.",
    price: 155.00,
    compareAtPrice: 200.00,
    categorySlug: "outerwear",
    slug: "ivory-pashmina-wrap",
    sizeType: "OneSize",
    collections: ["eid-collection", "summer-collection"],
  },
  // --- BAGS & ACCESSORIES ---
  {
    name: "Gold Embellished Clutch",
    description: "A compact gold clutch bag with crystal and bead embellishments on a satin base. Features a detachable chain strap and magnetic closure. The perfect accessory for festive outfits.",
    price: 75.00,
    compareAtPrice: 95.00,
    categorySlug: "bags-accessories",
    slug: "gold-embellished-clutch",
    sizeType: "OneSize",
    collections: ["eid-collection"],
  },
  {
    name: "Pearl Jhumka Earrings",
    description: "Handcrafted pearl jhumka earrings with gold-plated brass frame and dangling pearl drops. These traditional earrings add a touch of heritage to any outfit.",
    price: 38.00,
    compareAtPrice: null,
    categorySlug: "bags-accessories",
    slug: "pearl-jhumka-earrings",
    sizeType: "OneSize",
    collections: ["eid-collection"],
  },
  {
    name: "Woven Straw Tote Bag",
    description: "A natural woven straw tote bag with leather handles and a cotton-lined interior. Spacious enough for everyday essentials with a relaxed summer aesthetic.",
    price: 62.00,
    compareAtPrice: null,
    categorySlug: "bags-accessories",
    slug: "woven-straw-tote-bag",
    sizeType: "OneSize",
    collections: ["summer-collection"],
  },
  // --- SHOES ---
  {
    name: "Gold Khussa Flats",
    description: "Traditional gold khussa flats with intricate thread and mirror work. The cushioned sole ensures comfort while the pointed toe and curved silhouette honour classic Pakistani craftsmanship.",
    price: 52.00,
    compareAtPrice: 68.00,
    categorySlug: "shoes",
    slug: "gold-khussa-flats",
    sizeType: "ShoeSize",
    collections: ["eid-collection"],
  },
  {
    name: "Tan Leather Kolhapuri Sandals",
    description: "Hand-stitched tan leather kolhapuri sandals with wide cross straps and a flat sole. A timeless summer essential that pairs beautifully with both eastern and western outfits.",
    price: 45.00,
    compareAtPrice: null,
    categorySlug: "shoes",
    slug: "tan-leather-kolhapuri-sandals",
    sizeType: "ShoeSize",
    collections: ["summer-collection"],
  },
  {
    name: "Rose Gold Heeled Sandals",
    description: "Elegant rose gold heeled sandals with a slim ankle strap and block heel for stability. The metallic finish adds a modern touch to festive ensembles.",
    price: 89.00,
    compareAtPrice: 110.00,
    categorySlug: "shoes",
    slug: "rose-gold-heeled-sandals",
    sizeType: "ShoeSize",
    collections: ["eid-collection"],
  },
];

// Size templates matching the app's constants
const SIZE_TEMPLATES: Record<string, string[]> = {
  Standard: ["XS", "S", "M", "L", "XL"],
  ShoeSize: ["6", "7", "8", "9", "10", "11", "12"],
  OneSize: ["One Size"],
};

// Placeholder images (uses the existing public assets path)
function getPlaceholderImages(slug: string): string[] {
  return [
    `/assets/prodcut/${slug}-1.jpg`,
    `/assets/prodcut/${slug}-2.jpg`,
  ];
}

// ==========================================
// SAMPLE ORDERS
// ==========================================
const SAMPLE_ORDERS = [
  {
    deliveryName: "Ayesha Khan",
    deliveryEmail: "ayesha.khan@example.com",
    deliveryPhone: "+923001234567",
    deliveryStreet: "12 Gulberg III",
    deliveryCity: "Lahore",
    deliveryState: "Punjab",
    deliveryPostcode: "54000",
    deliveryCountry: "Pakistan",
    items: [
      { productSlug: "emerald-chiffon-anarkali", sizeLabel: "M", quantity: 1 },
      { productSlug: "gold-embellished-clutch", sizeLabel: "One Size", quantity: 1 },
    ],
    status: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.PAID,
  },
  {
    deliveryName: "Fatima Rizvi",
    deliveryEmail: "fatima.rizvi@example.com",
    deliveryPhone: "+923009876543",
    deliveryStreet: "45 DHA Phase 5",
    deliveryCity: "Karachi",
    deliveryState: "Sindh",
    deliveryPostcode: "75500",
    deliveryCountry: "Pakistan",
    items: [
      { productSlug: "ivory-organza-sharara-set", sizeLabel: "S", quantity: 1 },
      { productSlug: "pearl-jhumka-earrings", sizeLabel: "One Size", quantity: 2 },
      { productSlug: "gold-khussa-flats", sizeLabel: "7", quantity: 1 },
    ],
    status: OrderStatus.SHIPPED,
    paymentStatus: PaymentStatus.PAID,
  },
  {
    deliveryName: "Sana Ahmed",
    deliveryEmail: "sana.ahmed@example.com",
    deliveryPhone: "+923215551234",
    deliveryStreet: "78 F-7 Markaz",
    deliveryCity: "Islamabad",
    deliveryState: "ICT",
    deliveryPostcode: "44000",
    deliveryCountry: "Pakistan",
    items: [
      { productSlug: "blush-pink-lawn-suit", sizeLabel: "L", quantity: 1 },
      { productSlug: "sage-green-cotton-kurta", sizeLabel: "M", quantity: 1 },
      { productSlug: "woven-straw-tote-bag", sizeLabel: "One Size", quantity: 1 },
    ],
    status: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.PAID,
  },
  {
    deliveryName: "Zara Malik",
    deliveryEmail: "zara.malik@example.com",
    deliveryPhone: "+923331112222",
    deliveryStreet: "23 Bahria Town Phase 4",
    deliveryCity: "Rawalpindi",
    deliveryState: "Punjab",
    deliveryPostcode: "46000",
    deliveryCountry: "Pakistan",
    items: [
      { productSlug: "maroon-banarasi-lehenga", sizeLabel: "S", quantity: 1 },
      { productSlug: "champagne-velvet-shawl", sizeLabel: "One Size", quantity: 1 },
      { productSlug: "rose-gold-heeled-sandals", sizeLabel: "8", quantity: 1 },
    ],
    status: OrderStatus.PAID,
    paymentStatus: PaymentStatus.PAID,
  },
  {
    deliveryName: "Hira Qureshi",
    deliveryEmail: "hira.qureshi@example.com",
    deliveryPhone: "+923451239876",
    deliveryStreet: "56 Johar Town",
    deliveryCity: "Lahore",
    deliveryState: "Punjab",
    deliveryPostcode: "54000",
    deliveryCountry: "Pakistan",
    items: [
      { productSlug: "dusty-rose-gharara-set", sizeLabel: "M", quantity: 1 },
      { productSlug: "peach-net-angrakha", sizeLabel: "L", quantity: 1 },
    ],
    status: OrderStatus.PROCESSING,
    paymentStatus: PaymentStatus.PAID,
  },
  {
    deliveryName: "Noor Fatima",
    deliveryEmail: "noor.fatima@example.com",
    deliveryPhone: "+923007778899",
    deliveryStreet: "89 Model Town",
    deliveryCity: "Lahore",
    deliveryState: "Punjab",
    deliveryPostcode: "54700",
    deliveryCountry: "Pakistan",
    items: [
      { productSlug: "white-schiffli-maxi-dress", sizeLabel: "S", quantity: 1 },
      { productSlug: "sky-blue-linen-kaftan", sizeLabel: "One Size", quantity: 1 },
      { productSlug: "tan-leather-kolhapuri-sandals", sizeLabel: "6", quantity: 1 },
    ],
    status: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.PAID,
  },
];

// ==========================================
// MAIN SEED FUNCTION
// ==========================================
async function main() {
  console.log("Starting seed...\n");

  // --- 1. Seed Collections ---
  console.log("Seeding collections...");
  const collectionMap: Record<string, string> = {};

  for (const col of COLLECTIONS) {
    const existing = await prisma.collection.findUnique({ where: { slug: col.slug } });
    if (existing) {
      collectionMap[col.slug] = existing.id;
      console.log(`  Collection "${col.name}" already exists, skipping.`);
    } else {
      const created = await prisma.collection.create({ data: col });
      collectionMap[col.slug] = created.id;
      console.log(`  Created collection: ${col.name}`);
    }
  }

  // --- 2. Seed Products ---
  console.log("\nSeeding products...");
  const productMap: Record<string, { id: string; price: Decimal }> = {};

  // Build category slug-to-ID map
  const allCategories = await prisma.category.findMany();
  const categoryMap: Record<string, string> = {};
  for (const cat of allCategories) {
    categoryMap[cat.slug] = cat.id;
  }

  for (const product of PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
    if (existing) {
      productMap[product.slug] = { id: existing.id, price: existing.price };
      console.log(`  Product "${product.name}" already exists, skipping.`);
      continue;
    }

    const sizeLabels = SIZE_TEMPLATES[product.sizeType] || SIZE_TEMPLATES.Standard;
    const collectionIds = product.collections
      .map((slug) => collectionMap[slug])
      .filter(Boolean);

    const created = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        price: new Decimal(product.price),
        compareAtPrice: product.compareAtPrice ? new Decimal(product.compareAtPrice) : null,
        categories: categoryMap[product.categorySlug]
          ? { connect: { id: categoryMap[product.categorySlug] } }
          : undefined,
        slug: product.slug,
        isActive: true,
        images: getPlaceholderImages(product.slug),
        sizeType: product.sizeType as SizeTypeEnum,
        sizes: {
          create: sizeLabels.map((label) => ({
            label,
            stockTotal: 10,
            stockReserved: 0,
          })),
        },
        collections: {
          connect: collectionIds.map((id) => ({ id })),
        },
      },
    });

    productMap[product.slug] = { id: created.id, price: created.price };
    console.log(`  Created product: ${product.name} (Rs.${product.price})`);
  }

  // --- 3. Seed Orders ---
  console.log("\nSeeding orders...");

  for (const orderData of SAMPLE_ORDERS) {
    // Build cart items
    const cartItemsData: Array<{
      productId: string;
      sizeId: string;
      quantity: number;
      unitPrice: Decimal;
      title: string;
      image: string;
    }> = [];

    let orderTotal = new Decimal(0);

    for (const item of orderData.items) {
      const product = productMap[item.productSlug];
      if (!product) {
        console.log(`  WARNING: Product "${item.productSlug}" not found, skipping order item.`);
        continue;
      }

      // Find the matching size
      const size = await prisma.size.findFirst({
        where: { productId: product.id, label: item.sizeLabel },
      });
      if (!size) {
        console.log(`  WARNING: Size "${item.sizeLabel}" not found for product "${item.productSlug}", skipping.`);
        continue;
      }

      const productData = await prisma.product.findUnique({ where: { id: product.id } });
      if (!productData) continue;

      const itemTotal = product.price.mul(item.quantity);
      orderTotal = orderTotal.add(itemTotal);

      cartItemsData.push({
        productId: product.id,
        sizeId: size.id,
        quantity: item.quantity,
        unitPrice: product.price,
        title: productData.name,
        image: productData.images[0] || "",
      });
    }

    if (cartItemsData.length === 0) {
      console.log(`  Skipping order for ${orderData.deliveryName} (no valid items).`);
      continue;
    }

    // Create cart + items + order in a transaction
    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.create({
        data: {
          status: CartStatus.ORDERED,
          checkoutAt: new Date(),
          items: {
            create: cartItemsData,
          },
        },
      });

      await tx.order.create({
        data: {
          cartId: cart.id,
          delieveryName: orderData.deliveryName,
          deliveryEmail: orderData.deliveryEmail,
          deliveryPhone: orderData.deliveryPhone,
          deliveryStreetAddress: orderData.deliveryStreet,
          deliveryCity: orderData.deliveryCity,
          deliveryState: orderData.deliveryState,
          deliveryPostcode: orderData.deliveryPostcode,
          deliveryCountry: orderData.deliveryCountry,
          billingName: orderData.deliveryName,
          billingStreetAddress: orderData.deliveryStreet,
          billingCity: orderData.deliveryCity,
          billingState: orderData.deliveryState,
          billingPostcode: orderData.deliveryPostcode,
          billingCountry: orderData.deliveryCountry,
          totalPrice: orderTotal,
          paymentMethod: PaymentMethod.PAYFAST,
          paymentStatus: orderData.paymentStatus,
          status: orderData.status,
        },
      });

      console.log(`  Created order for ${orderData.deliveryName} (${cartItemsData.length} items, Rs.${orderTotal.toFixed(2)})`);
    });
  }

  console.log("\nSeed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
