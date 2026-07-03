import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { SearchField } from "../components/ui/search-field";

const meta = {
  title: "Components/SearchField",
  component: SearchField,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryObj<typeof SearchField>;

function Controlled({ size }: { size: "lg" | "sm" }) {
  const [value, setValue] = useState("");
  return (
    <SearchField
      size={size}
      value={value}
      onValueChange={setValue}
      placeholder="Search…"
      aria-label="Search"
    />
  );
}

export const Large: Story = {
  render: () => <Controlled size="lg" />,
};

export const Small: Story = {
  render: () => <Controlled size="sm" />,
};
