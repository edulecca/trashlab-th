"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "ui-system";

/**
 * Three-column shell for the bill creation screen, built on the shadcn/radix
 * Resizable (react-resizable-panels). Each column is a draggable panel; the
 * right (document preview) and left (bill list) borders resize against the
 * center form via the grip handles.
 */
export function ResizableColumns({
  left,
  right,
  children,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      // Seed the server-rendered layout so panels get their flex sizes on first
      // paint instead of collapsing to auto width and snapping in after hydration.
      defaultLayout={{ left: 22, center: 46, right: 32 }}
      className="min-h-0 flex-1"
    >
      {/* Left — bill list rail */}
      <ResizablePanel
        id="left"
        defaultSize="22%"
        minSize="15%"
        maxSize="32%"
        className="flex h-full flex-col border-r bg-background"
      >
        {left}
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Center — bill form */}
      <ResizablePanel
        id="center"
        defaultSize="46%"
        minSize="30%"
        className="flex h-full min-w-0 flex-col bg-background"
      >
        {children}
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right — document preview */}
      <ResizablePanel
        id="right"
        defaultSize="32%"
        minSize="20%"
        maxSize="50%"
        className="h-full min-w-0"
      >
        {right}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
