import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FeatureCard } from "./FeatureCard";

const meta = {
  title: "Common/FeatureCard",
  component: FeatureCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A feature card component that displays a number, title, and description. Perfect for showcasing key features, benefits, or process steps in a structured format.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    number: {
      control: "text",
      description: "Number or step identifier (e.g., '01', '02', 'Step 1')",
    },
    title: {
      control: "text",
      description: "Feature or benefit title",
    },
    description: {
      control: "text",
      description: "Detailed description of the feature or benefit",
    },
  },
} satisfies Meta<typeof FeatureCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    number: "01",
    title: "Mastered Craft",
    description:
      "Uncompromising quality sourced from the heart of tradition. Built to last; designed to be felt.",
  },
};
