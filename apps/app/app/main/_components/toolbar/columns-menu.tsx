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

/** Toolbar control: pick which columns show and drag to reorder. Vendor is locked. */
export function ColumnsMenu() {
  const columnOrder = useBillsView((s) => s.columnOrder);
  const setColumnOrder = useBillsView((s) => s.setColumnOrder);

  const locked = columnOrder.filter(
    (k) => COLUMNS.find((c) => c.key === k)?.locked
  );
  const sortable = columnOrder.filter(
    (k) => !COLUMNS.find((c) => c.key === k)?.locked
  );

  const sensors = useSensors(useSensor(PointerSensor));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = sortable.indexOf(active.id as ColumnKey);
    const to = sortable.indexOf(over.id as ColumnKey);
    setColumnOrder([...locked, ...arrayMove(sortable, from, to)]);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton aria-label="Columns">
          <Columns3 className="size-4" />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1.5">
        {/* Locked column: always visible, not draggable. */}
        {locked.map((k) => (
          <div key={k} className="flex items-center gap-3 px-2 py-2">
            <Checkbox checked disabled aria-label={`${label(k)} (always shown)`} />
            <span className="flex-1 truncate text-sm text-muted-foreground">
              {label(k)}
            </span>
          </div>
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
      </PopoverContent>
    </Popover>
  );
}
