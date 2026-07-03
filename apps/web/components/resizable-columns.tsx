"use client";

import { useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  usePanelRef,
} from "ui-system";

import { useRailToggle } from "./rail-toggle";

/**
 * Three-column shell for the bill screens, built on react-resizable-panels. Each
 * column is a draggable panel. The left rail is collapsible: the top-bar toggle
 * drives it via `useRailToggle`, and dragging it shut syncs the toggle back.
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
  const { collapsed, setCollapsed, setRailSize } = useRailToggle();
  const leftPanel = usePanelRef();

  // Reflect the toggle onto the panel (collapse/expand imperatively).
  useEffect(() => {
    const panel = leftPanel.current;
    if (!panel) return;
    if (collapsed && !panel.isCollapsed()) panel.collapse();
    else if (!collapsed && panel.isCollapsed()) panel.expand();
  }, [collapsed, leftPanel]);

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      // Seed the server-rendered layout so panels get their flex sizes on first
      // paint instead of collapsing to auto width and snapping in after hydration.
      defaultLayout={{ left: 22, center: 46, right: 32 }}
      className="min-h-0 flex-1"
    >
      {/* Left — bill list rail (collapsible) */}
      <ResizablePanel
        id="left"
        panelRef={leftPanel}
        collapsible
        collapsedSize={0}
        defaultSize="22%"
        minSize="15%"
        maxSize="32%"
        // Keep the toggle + top-bar divider in sync with the rail's live width.
        onResize={(size) => {
          setCollapsed(size.asPercentage < 1);
          setRailSize(size.asPercentage);
        }}
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
