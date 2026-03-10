import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CheckoutCartItem } from "./CheckoutCartItem";

const meta = {
  title: "Checkout/CheckoutCartItem",
  component: CheckoutCartItem,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A single cart item row for the checkout sidebar with product image, details, and total price.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    item: {
      control: "object",
      description: "Cart item details",
    },
  },
} satisfies Meta<typeof CheckoutCartItem>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseItem = {
  id: "item_1",
  cartId: "cart_1",
  productId: "prod_1",
  sizeId: "size_m",
  slug: "classic-wool-coat",
  quantity: 2,
  unitPrice: 79.5,
  title: "Classic Wool Coat",
  image: "/assets/clothes-model.jpg",
  createdAt: new Date(),
  updatedAt: new Date(),
  size: {
    id: "size_m",
    label: "M",
  },
};

export const Default: Story = {
  args: {
    item: baseItem,
  },
};

export const LargeQuantity: Story = {
  args: {
    item: {
      ...baseItem,
      quantity: 5,
    },
  },
};

export const DifferentSize: Story = {
  args: {
    item: {
      ...baseItem,
      size: { id: "size_l", label: "L" },
    },
  },
};
