import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OrderSummaryStepUI } from "./OrderSummaryStepUI";

const meta = {
  title: "Checkout/CheckoutForm/OrderSummaryStepUI",
  component: OrderSummaryStepUI,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Order summary step UI for the checkout flow. Includes terms text and a native form that POSTs to /api/checkout/place-order.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    isSubmitting: {
      control: "boolean",
      description: "Whether the placement is in progress (shows the spinner)",
    },
    onSubmit: {
      action: "submit",
      description: "Fired on form submit (used to show the spinner)",
    },
  },
} satisfies Meta<typeof OrderSummaryStepUI>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleDelivery = {
  fullName: "Amelia Clarke",
  email: "amelia@example.com",
  phone: "03001234567",
  address: "123 Main Street",
  city: "Bahawalpur",
  state: "Punjab",
  zipCode: "63100",
  country: "Pakistan",
  useSameBillingAddress: true,
  orderNote: "",
};

export const Default: Story = {
  args: {
    isSubmitting: false,
    onSubmit: () => {},
    orderId: "order_123",
    paymentMethod: "COD",
    delivery: sampleDelivery,
    buttonText: "Place Order",
  },
};

export const Submitting: Story = {
  args: {
    isSubmitting: true,
    onSubmit: () => {},
    orderId: "order_123",
    paymentMethod: "COD",
    delivery: sampleDelivery,
    buttonText: "Place Order",
  },
};
