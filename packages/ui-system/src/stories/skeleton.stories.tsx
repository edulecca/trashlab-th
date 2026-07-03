import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton } from "../components/ui/skeleton";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Line: Story = {
  render: () => <Skeleton className="h-4 w-48" />,
};

export const Card: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton className="size-9 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  ),
};
