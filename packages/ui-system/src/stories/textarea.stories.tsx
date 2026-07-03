import type { Meta, StoryObj } from "@storybook/react-vite";

import { Textarea } from "../components/ui/textarea";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    label: "Description",
    defaultValue:
      "Office furniture and computer peripherals including chairs, desks and monitors.",
  },
  decorators: [
    (Story) => (
      <div className="w-[520px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Framed field: square corners, min 60px, label inside the box, grows with content. */
export const Default: Story = {};

export const Placeholder: Story = {
  args: { defaultValue: undefined, placeholder: "What is this bill for?" },
};

export const Required: Story = {
  args: { required: true },
};

export const Invalid: Story = {
  args: { defaultValue: "", invalid: true, placeholder: "Required" },
};

/** Without a label the component falls back to the plain textarea. */
export const PlainCompact: Story = {
  args: { label: undefined, defaultValue: undefined, placeholder: "Notes" },
};
