"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Coordinates the left rail between the top-bar toggle and ResizableColumns:
 * collapse state, plus the rail's live width (%) so the top bar's left section
 * can track it and keep its divider aligned with the rail/form border.
 */
type RailToggle = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
  railSize: number;
  setRailSize: (n: number) => void;
};

const RAIL_DEFAULT_SIZE = 22;

const Ctx = createContext<RailToggle>({
  collapsed: false,
  setCollapsed: () => {},
  toggle: () => {},
  railSize: RAIL_DEFAULT_SIZE,
  setRailSize: () => {},
});

export function RailToggleProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [railSize, setRailSize] = useState(RAIL_DEFAULT_SIZE);
  return (
    <Ctx.Provider
      value={{
        collapsed,
        setCollapsed,
        toggle: () => setCollapsed((c) => !c),
        railSize,
        setRailSize,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useRailToggle() {
  return useContext(Ctx);
}
