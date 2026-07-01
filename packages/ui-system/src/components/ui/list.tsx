"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { cn } from "../../lib/utils";

type ListProps<T> = {
  /** Items to render. */
  data: readonly T[];
  /** Render a row for a single item. Compose `ListItem` here. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Stable key per item; falls back to the virtual index key. */
  getKey?: (item: T, index: number) => string | number;
  /** Estimated row height in px, used before measurement. */
  estimateSize?: number;
  /** Rows to render beyond the viewport on each side. */
  overscan?: number;
  className?: string;
};

/**
 * Virtualized list backed by TanStack Virtual. Only the visible rows are
 * mounted, so long lists stay fast. The list fills its parent's height and
 * scrolls internally — give it a sized container.
 */
function List<T>({
  data,
  renderItem,
  getKey,
  estimateSize = 64,
  overscan = 8,
  className,
}: ListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div ref={parentRef} className={cn("h-full overflow-auto", className)}>
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((row) => (
          <div
            key={getKey ? getKey(data[row.index], row.index) : row.key}
            data-index={row.index}
            ref={virtualizer.measureElement}
            className="absolute left-0 top-0 w-full"
            style={{ transform: `translateY(${row.start}px)` }}
          >
            {renderItem(data[row.index], row.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

type ListItemProps = {
  leftAccessory?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  rightAccessory?: React.ReactNode;
} & React.ComponentProps<"div">;

/**
 * A single row: optional left accessory (avatar/icon), a title with an optional
 * subtitle, and an optional right accessory. No separators between items.
 */
function ListItem({
  leftAccessory,
  title,
  subtitle,
  rightAccessory,
  className,
  ...props
}: ListItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5",
        props.onClick && "cursor-pointer rounded-lg hover:bg-muted",
        className
      )}
      {...props}
    >
      {leftAccessory != null ? (
        <div className="shrink-0">{leftAccessory}</div>
      ) : null}
      <div className="min-w-0 flex-1">
        {title != null ? (
          <div className="truncate font-medium text-foreground">{title}</div>
        ) : null}
        {subtitle != null ? (
          <div className="truncate text-sm text-muted-foreground">
            {subtitle}
          </div>
        ) : null}
      </div>
      {rightAccessory != null ? (
        <div className="shrink-0 text-muted-foreground">{rightAccessory}</div>
      ) : null}
    </div>
  );
}

export { List, ListItem, type ListProps, type ListItemProps };
