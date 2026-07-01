import type { Meta, StoryObj } from "@storybook/react-vite";
import { Landmark, Store } from "lucide-react";

import { List, ListItem } from "./list";

type Bill = { id: string; vendor: string; person: string; date: string };

const BILLS: Bill[] = [
  { id: "1", vendor: "Michelin Tires", person: "Andrew Garcia", date: "Mar 6, 2024" },
  { id: "2", vendor: "Omnicom Group", person: "Priya Nair", date: "Jan 17, 2026" },
  { id: "3", vendor: "FedEx", person: "Marcus Lee", date: "Jan 30, 2026" },
  { id: "4", vendor: "ActionINC", person: "Sofia Rossi", date: "Feb 5, 2026" },
  { id: "5", vendor: "Sync Software Inc.", person: "Daniel Kim", date: "Feb 10, 2026" },
  { id: "6", vendor: "Highspot", person: "Emma Thompson", date: "Feb 12, 2026" },
  { id: "7", vendor: "PricewaterhouseCoopers", person: "Liam Walsh", date: "Feb 25, 2026" },
  { id: "8", vendor: "DHL Express", person: "Noah Bennett", date: "Mar 15, 2026" },
  { id: "9", vendor: "W.B. Mason", person: "Olivia Grant", date: "Dec 25, 2025" },
  { id: "10", vendor: "Amazon", person: "Ethan Cole", date: "Apr 15, 2025" },
];

function VendorAvatar() {
  return (
    <span className="grid size-10 place-items-center rounded-full border text-muted-foreground">
      <Store className="size-4" />
    </span>
  );
}

type ListDemoProps = {
  leftAccessory: boolean;
  rightAccessory: boolean;
};

function ListDemo({ leftAccessory, rightAccessory }: ListDemoProps) {
  return (
    <div className="h-[360px] w-[420px] overflow-hidden rounded-xl border">
      <List
        data={BILLS}
        getKey={(b) => b.id}
        estimateSize={64}
        renderItem={(b) => (
          <ListItem
            leftAccessory={leftAccessory ? <VendorAvatar /> : undefined}
            title={b.vendor}
            subtitle={`${b.person} · ${b.date}`}
            rightAccessory={
              rightAccessory ? <Landmark className="size-5" /> : undefined
            }
          />
        )}
      />
    </div>
  );
}

const meta = {
  title: "Components/List",
  component: ListDemo,
  parameters: { layout: "centered" },
  argTypes: {
    leftAccessory: { control: "boolean" },
    rightAccessory: { control: "boolean" },
  },
  args: { leftAccessory: true, rightAccessory: true },
} satisfies Meta<typeof ListDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
