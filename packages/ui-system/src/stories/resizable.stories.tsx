import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../components/ui/resizable";

type ResizableDemoProps = {
  orientation?: "horizontal" | "vertical";
  withHandle?: boolean;
};

function Pane({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-sm font-medium text-muted-foreground">
      {label}
    </div>
  );
}

function ResizableDemo({
  orientation = "horizontal",
  withHandle = true,
}: ResizableDemoProps) {
  // The panel group forces `height:100%;width:100%` inline, so it must be sized
  // by a parent with definite dimensions — otherwise it collapses.
  return (
    <div className="h-[360px] w-[640px] overflow-hidden rounded-xl border">
      <ResizablePanelGroup orientation={orientation}>
        <ResizablePanel defaultSize={30} minSize={15}>
          <Pane label="Bill list" />
        </ResizablePanel>
        <ResizableHandle withHandle={withHandle} />
        <ResizablePanel defaultSize={40} minSize={25}>
          <Pane label="Bill form" />
        </ResizablePanel>
        <ResizableHandle withHandle={withHandle} />
        <ResizablePanel defaultSize={30} minSize={15}>
          <Pane label="Document preview" />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

const meta = {
  title: "Components/Resizable",
  component: ResizableDemo,
  parameters: { layout: "centered" },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
    withHandle: { control: "boolean" },
  },
  args: { orientation: "horizontal", withHandle: true },
} satisfies Meta<typeof ResizableDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Vertical: Story = { args: { orientation: "vertical" } };

export const WithoutHandle: Story = { args: { withHandle: false } };
