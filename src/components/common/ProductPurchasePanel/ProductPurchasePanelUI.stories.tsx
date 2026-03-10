import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProductPurchasePanelUI } from "./ProductPurchasePanelUI";

const meta = {
  title: "Common/ProductPurchasePanelUI",
  component: ProductPurchasePanelUI,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A panel component for purchasing a product, including price, quantity selection, and add-to-cart functionality.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    product: {
      control: "object",
      description: "Product object with sizes, name, price, and description.",
    },
    defaultSize: {
      control: "text",
      description: "Default selected size ID.",
    },
    isLoading: {
      control: "boolean",
      description: "Loading state for add to cart button.",
    },
    onAddToCart: {
      action: "addToCart",
      description: "Callback when add to cart is clicked.",
    },
  },
} satisfies Meta<typeof ProductPurchasePanelUI>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseArgs = {
  product: {
    id: "prod_1",
    name: "Mock Product",
    description: "A great product for testing.",
    price: 49.99,
    compareAtPrice: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: ["/assets/clothes-model.jpg"],
    slug: "mock-product",
    categories: [{ name: "Dresses", slug: "dresses" }],
    sizeType: "Standard",
    sizes: [
      {
        id: "size_s",
        label: "S",
        productId: "prod_1",
        stockTotal: 10,
        stockReserved: 0,
      },
      {
        id: "size_m",
        label: "M",
        productId: "prod_1",
        stockTotal: 5,
        stockReserved: 0,
      },
      {
        id: "size_l",
        label: "L",
        productId: "prod_1",
        stockTotal: 5,
        stockReserved: 0,
      },
    ],
  },
  defaultSize: "size_s",
  isLoading: false,
  isError: false,
  onAddToCart: async () => {},
};

export const Default: Story = {
  args: {
    ...baseArgs,
  },
  render: (args) => (
    <div className="w-80">
      <ProductPurchasePanelUI {...args} />
    </div>
  ),
};

export const Loading: Story = {
  args: {
    ...baseArgs,
  },
  render: (args) => (
    <div className="w-80">
      <ProductPurchasePanelUI {...args} isLoading={true} />
    </div>
  ),
};

export const Error: Story = {
  args: {
    ...baseArgs,
  },
  render: (args) => (
    <div className="w-80">
      <ProductPurchasePanelUI {...args} isError={true} />
    </div>
  ),
};
