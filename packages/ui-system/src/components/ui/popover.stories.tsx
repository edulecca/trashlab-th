import type { Meta, StoryObj } from "@storybook/react-vite";
import { Columns3, GripVertical } from "lucide-react";

import { Button } from "./button";
import { Checkbox } from "./checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

const meta = {
  title: "Components/Popover",
  component: Popover,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <p className="text-sm text-muted-foreground">
          Popover content — anchored to the trigger, dismissed on outside click.
        </p>
      </PopoverContent>
    </Popover>
  ),
};

/** The columns picker pattern used by the bills toolbar. */
export const ColumnsPicker: Story = {
  render: () => {
    const columns = [
      { label: "Vendor / owner", locked: true },
      { label: "Invoice" },
      { label: "Due date" },
      { label: "Status" },
      { label: "Amount" },
    ];
    return (
      <Popover>
        <PopoverTrigger
          aria-label="Columns"
          className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground data-[state=open]:bg-muted"
        >
          <Columns3 className="size-4" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-1.5">
          {columns.map((c) => (
            <div key={c.label} className="flex items-center gap-3 px-2 py-2">
              <Checkbox checked disabled={c.locked} />
              <span
                className={`flex-1 truncate text-sm ${
                  c.locked ? "text-muted-foreground" : ""
                }`}
              >
                {c.label}
              </span>
              {!c.locked ? (
                <GripVertical className="size-4 text-muted-foreground" />
              ) : null}
            </div>
          ))}
        </PopoverContent>
      </Popover>
    );
  },
};
