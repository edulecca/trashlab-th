import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

type TabsDemoProps = {
  size?: "md" | "lg";
  variant?: "default" | "line";
};

function TabsDemo({ size = "md", variant = "default" }: TabsDemoProps) {
  return (
    <Tabs defaultValue="needs-review" className="w-[520px]">
      <TabsList size={size} variant={variant}>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="needs-review">Needs review</TabsTrigger>
        <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        <TabsTrigger value="paid">Paid</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="pt-4 text-muted-foreground">
        All bills across every status.
      </TabsContent>
      <TabsContent value="needs-review" className="pt-4 text-muted-foreground">
        Bills waiting for review and approval.
      </TabsContent>
      <TabsContent value="scheduled" className="pt-4 text-muted-foreground">
        Bills with a scheduled payment.
      </TabsContent>
      <TabsContent value="paid" className="pt-4 text-muted-foreground">
        Bills that have been paid.
      </TabsContent>
    </Tabs>
  );
}

const meta = {
  title: "Components/Tabs",
  component: TabsDemo,
  parameters: { layout: "centered" },
  argTypes: {
    size: { control: "inline-radio", options: ["md", "lg"] },
    variant: { control: "inline-radio", options: ["default", "line"] },
  },
  args: { size: "md", variant: "default" },
} satisfies Meta<typeof TabsDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Line: Story = { args: { variant: "line" } };
