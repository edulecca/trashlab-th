"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Columns3, GripVertical } from "lucide-react";
import { Checkbox, Popover, PopoverContent, PopoverTrigger } from "ui-system";

import { IconButton } from "@/components/icon-button";
import { COLUMNS, useBillsView, type ColumnKey } from "@/stores/bills-view";

const label = (key: ColumnKey) =>
  COLUMNS.find((c) => c.key === key)?.label ?? key;

/** A pinned (non-hideable, non-draggable) column row — checked & disabled. */
function PinnedRow({ columnKey }: { columnKey: ColumnKey }) {
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <Checkbox
        checked
        disabled
        aria-label={`${label(columnKey)} (always shown)`}
      />
      <span className="flex-1 truncate text-sm text-muted-foreground">
        {label(columnKey)}
      </span>
    </div>
  );
}

function SortableRow({ columnKey }: { columnKey: ColumnKey }) {
  const visible = useBillsView((s) => s.columnVisibility[columnKey]);
  const toggleColumn = useBillsView((s) => s.toggleColumn);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: columnKey });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-md px-2 py-2 ${
        isDragging ? "bg-muted" : ""
      }`}
    >
      <Checkbox
        checked={visible}
        onCheckedChange={() => toggleColumn(columnKey)}
        aria-label={`Toggle ${label(columnKey)}`}
      />
      <span className="flex-1 truncate text-sm">{label(columnKey)}</span>
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${label(columnKey)}`}
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
    </div>
  );
}

const pinOf = (key: ColumnKey) => COLUMNS.find((c) => c.key === key)?.pin;

/** Toolbar control: pick which columns show and drag to reorder. Pinned columns
 * (Vendor first, Action last) stay fixed and can't be hidden. */
export function ColumnsMenu() {
  const columnOrder = useBillsView((s) => s.columnOrder);
  const setColumnOrder = useBillsView((s) => s.setColumnOrder);

  const start = columnOrder.filter((k) => pinOf(k) === "start");
  const end = columnOrder.filter((k) => pinOf(k) === "end");
  const sortable = columnOrder.filter((k) => !pinOf(k));

  const sensors = useSensors(useSensor(PointerSensor));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = sortable.indexOf(active.id as ColumnKey);
    const to = sortable.indexOf(over.id as ColumnKey);
    // Keep pinned columns anchored at their edges.
    setColumnOrder([...start, ...arrayMove(sortable, from, to), ...end]);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton aria-label="Columns">
          <Columns3 className="size-4" />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1.5">
        {/* Pinned columns: always visible, not draggable. Rendered at their edge. */}
        {start.map((k) => (
          <PinnedRow key={k} columnKey={k} />
        ))}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={sortable} strategy={verticalListSortingStrategy}>
            {sortable.map((k) => (
              <SortableRow key={k} columnKey={k} />
            ))}
          </SortableContext>
        </DndContext>

        {end.map((k) => (
          <PinnedRow key={k} columnKey={k} />
        ))}
      </PopoverContent>
    </Popover>
  );
}
