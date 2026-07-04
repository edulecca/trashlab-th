"use client";

import { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  usePanelRef,
} from "ui-system";

import { useRailToggle } from "./rail-toggle";

/**
 * Shell for the bill screens.
 *
 * Desktop (md+): three draggable columns — list rail · content · document
 * preview — built on react-resizable-panels; the left rail is collapsible via
 * the top-bar toggle.
 *
 * Mobile: the resizable columns don't fit, so we stack the list rail on top of
 * the content and drop the document preview (upload/preview is a desktop
 * affordance). Single-render per breakpoint — no double-mounting the stateful
 * form/preview.
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

  // Mobile breakpoint (client-only; SSR renders the desktop layout to stay
  // hydration-stable, then swaps on mount if we're on a narrow screen).
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Reflect the toggle onto the panel (desktop only; no-op while unmounted).
  useEffect(() => {
    const panel = leftPanel.current;
    if (!panel) return;
    if (collapsed && !panel.isCollapsed()) panel.collapse();
    else if (!collapsed && panel.isCollapsed()) panel.expand();
  }, [collapsed, leftPanel]);

  if (isMobile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        {/* List rail on top — capped + scrollable so the content stays reachable. */}
        <div className="max-h-[38vh] shrink-0 overflow-auto border-b">{left}</div>
        {/* Main content below; the document preview (right) is dropped on mobile. */}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    );
  }

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
