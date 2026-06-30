import type { Meta, StoryObj } from "@storybook/react-vite";
import { BadgeCheck } from "lucide-react";

import { Badge } from "./badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "destructive",
        "success",
        "warning",
        "outline",
      ],
    },
    size: { control: "inline-radio", options: ["md", "lg"] },
    outline: { control: "boolean" },
    asChild: { table: { disable: true } },
  },
  args: { variant: "success", size: "md", outline: false, children: "Paid" },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithoutIcon: Story = {};

export const WithIcon: Story = {
  render: ({ children, ...args }) => (
    <Badge {...args}>
      <BadgeCheck data-icon="inline-start" />
      {children}
    </Badge>
  ),
};
