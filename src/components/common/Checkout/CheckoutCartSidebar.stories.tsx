import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CheckoutCartSidebar } from "./CheckoutCartSidebar";

const meta = {
  title: "Checkout/CheckoutCartSidebar",
  component: CheckoutCartSidebar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Checkout sidebar showing cart items and order summary totals.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    items: {
      control: "object",
      description: "Cart items",
    },
    summary: {
      control: "object",
      description: "Cart summary totals",
    },
  },
} satisfies Meta<typeof CheckoutCartSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseItems = [
  {
    id: "item_1",
    cartId: "cart_1",
    productId: "prod_1",
    sizeId: "size_m",
    slug: "classic-wool-coat",
    quantity: 1,
    unitPrice: 79.5,
    title: "Classic Wool Coat",
    image: "/assets/clothes-model.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
    size: { id: "size_m", label: "M" },
  },
  {
    id: "item_2",
    cartId: "cart_1",
    productId: "prod_2",
    sizeId: "size_s",
    slug: "cashmere-turtleneck",
    quantity: 2,
    unitPrice: 49.99,
    title: "Cashmere Turtleneck",
    image: "/assets/clothes-model.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
    size: { id: "size_s", label: "S" },
  },
];

const baseSummary = {
  subtotal: "Rs.179.48",
  shipping: "Rs.12.00",
  total: "Rs.191.48",
  itemCount: 3,
};

export const Default: Story = {
  args: {
    items: baseItems,
    summary: baseSummary,
  },
};

export const SingleItem: Story = {
  args: {
    items: [baseItems[0]],
    summary: {
      subtotal: "Rs.79.50",
      shipping: "Rs.8.00",
      total: "Rs.87.50",
      itemCount: 1,
    },
  },
};

export const FreeShipping: Story = {
  args: {
    items: baseItems,
    summary: {
      subtotal: "Rs.199.00",
      shipping: "Free",
      total: "Rs.199.00",
      itemCount: 3,
    },
  },
};
