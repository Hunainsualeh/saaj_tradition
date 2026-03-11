import { PrismaClient, PaymentStatus, OrderStatus, CartStatus, PaymentMethod } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orderId = "cmmkej9eo0005up6gjlqovyyn";

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, cartId: true, paymentStatus: true, status: true },
  });

  console.log("Before:", order);

  if (!order) {
    console.log("Order not found");
    return;
  }

  if (order.paymentStatus === PaymentStatus.PAID) {
    console.log("Order already PAID — nothing to do");
    return;
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.PAID,
        paymentMethod: PaymentMethod.PAYFAST,
        updatedAt: new Date(),
      },
    }),
    prisma.cart.update({
      where: { id: order.cartId },
      data: {
        status: CartStatus.ORDERED,
        checkoutAt: new Date(),
      },
    }),
  ]);

  const after = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, paymentStatus: true, status: true },
  });

  console.log("After:", after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
