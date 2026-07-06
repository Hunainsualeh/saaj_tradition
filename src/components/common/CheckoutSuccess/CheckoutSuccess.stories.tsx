import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CheckoutSuccessUI } from "./CheckoutSuccessUI";

const sampleOrder = {
  id: "order-1",
  orderNumber: 12345,
  createdAt: new Date("2026-03-09"),
  deliveryEmail: "customer@example.com",
  delieveryName: "Jane Doe",
  deliveryPhone: "+92300000000",
  deliveryStreetAddress: "123 Main Street",
  deliveryCity: "Karachi",
  deliveryPostcode: "75500",
  deliveryState: "Sindh",
  deliveryCountry: "PK",
  billingName: "Jane Doe",
  billingStreetAddress: "123 Main Street",
  billingCity: "Karachi",
  billingPostcode: "75500",
  billingState: "Sindh",
  billingCountry: "PK",
  totalPrice: 4999,
  shippingAmount: 200,
  couponCode: null,
  discountPercent: null,
  discountAmount: null,
  paymentMethod: "COD",
  trackingToken: "abc123",
  items: [
    {
      id: "item-1",
      title: "Timeless Beauty",
      image: "/assets/clothes-model.jpg",
      quantity: 1,
      unitPrice: 4799,
      size: { label: "M" },
    },
  ],
};

const meta = {
  title: "Checkout/CheckoutSuccess",
  component: CheckoutSuccessUI,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CheckoutSuccessUI>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { order: sampleOrder },
};

export const NoBilling: Story = {
  args: { order: { ...sampleOrder, billingName: null, billingStreetAddress: null, billingCity: null, billingPostcode: null, billingState: null, billingCountry: null } },
};
