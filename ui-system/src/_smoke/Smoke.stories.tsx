import type { Meta, StoryObj } from "@storybook/react-vite";

// Temporary smoke-test story to verify Storybook boots.
// Delete once the first real design-system component lands.
function Smoke({ label }: { label: string }) {
  return <button type="button">{label}</button>;
}

const meta = {
  title: "_smoke/Smoke",
  component: Smoke,
  args: { label: "Storybook is alive" },
} satisfies Meta<typeof Smoke>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
