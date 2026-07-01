"use client";

import { useRef, useState } from "react";
import { cn } from "ui-system";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const LEFT = { default: 320, min: 240, max: 480 };
const RIGHT = { default: 560, min: 360, max: 760 };

/** A draggable vertical divider. Uses pointer capture so the drag keeps
 * tracking even when the cursor leaves the thin hit area. */
function Handle({
  onResize,
  className,
}: {
  onResize: (deltaX: number) => void;
  className?: string;
}) {
  const active = useRef(false);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onPointerDown={(e) => {
        active.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (active.current) onResize(e.movementX);
      }}
      onPointerUp={(e) => {
        active.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      className={cn(
        "group relative w-1.5 shrink-0 cursor-col-resize touch-none select-none",
        className
      )}
    >
      <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-primary/40" />
    </div>
  );
}

export function ResizableColumns({
  left,
  right,
  children,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  children: React.ReactNode;
}) {
  const [leftW, setLeftW] = useState(LEFT.default);
  const [rightW, setRightW] = useState(RIGHT.default);

  return (
    <div className="flex min-h-0 flex-1">
      {/* Left — bill list rail */}
      <div
        className="hidden shrink-0 flex-col border-r bg-background lg:flex"
        style={{ width: leftW }}
      >
        {left}
      </div>
      <Handle
        className="hidden lg:block"
        onResize={(dx) => setLeftW((w) => clamp(w + dx, LEFT.min, LEFT.max))}
      />

      {/* Center */}
      <main className="flex min-w-0 flex-1 flex-col bg-background">
        {children}
      </main>

      {/* Right — document preview */}
      <Handle
        className="hidden xl:block"
        onResize={(dx) => setRightW((w) => clamp(w - dx, RIGHT.min, RIGHT.max))}
      />
      <div
        className="hidden shrink-0 border-l xl:block"
        style={{ width: rightW }}
      >
        {right}
      </div>
    </div>
  );
}
