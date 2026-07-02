import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar, Network } from "lucide-react";

import { Input } from "./input";

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { label: "Invoice #", defaultValue: "160610" },
  decorators: [
    (Story) => (
      <div className="w-[420px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Framed field: fixed 60px, square corners, label inside the box. */
export const Default: Story = {};

export const Required: Story = {
  args: { label: "Invoice date", required: true, defaultValue: "Jan 20, 2026" },
};

export const RightAccessory: Story = {
  args: {
    label: "Due date",
    required: true,
    defaultValue: "Feb 20, 2026",
    rightAccessory: <Calendar />,
  },
};

export const LeftAccessory: Story = {
  args: {
    label: "Create bill under",
    defaultValue: "Save Time Inc",
    leftAccessory: <Network />,
  },
};

export const Invalid: Story = {
  args: { label: "Invoice #", defaultValue: "", invalid: true, placeholder: "Required" },
};

export const Disabled: Story = {
  args: { label: "Invoice #", defaultValue: "160610", disabled: true },
};

/** Without a label the component falls back to the compact plain input. */
export const PlainCompact: Story = {
  args: { label: undefined, defaultValue: "", placeholder: "0.00" },
};
