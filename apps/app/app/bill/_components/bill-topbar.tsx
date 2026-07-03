"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ArrowLeft, PanelLeft, Plus } from "lucide-react";
import { Button } from "ui-system";

import { useRailToggle } from "@/components/rail-toggle";
import { VendorAvatar } from "@/components/vendor-avatar";
import { useBillDraft } from "@/stores/bill-draft";

/** Bill context shown in the top bar (published by the active screen). */
type BillHeader = {
  vendorName: string;
  vendorImg: string | null;
  number: string;
  statusLabel: string;
};

const Ctx = createContext<{
  header: BillHeader | null;
  setHeader: (h: BillHeader | null) => void;
}>({ header: null, setHeader: () => {} });

export function BillTopbarProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<BillHeader | null>(null);
  return <Ctx.Provider value={{ header, setHeader }}>{children}</Ctx.Provider>;
}

/** Publish the active bill's context into the top bar; clears on unmount. */
export function useBillTopbar(header: BillHeader) {
  const { setHeader } = useContext(Ctx);
  const { vendorName, vendorImg, number, statusLabel } = header;
  useEffect(() => {
    setHeader({ vendorName, vendorImg, number, statusLabel });
    return () => setHeader(null);
  }, [setHeader, vendorName, vendorImg, number, statusLabel]);
}

/** Server-friendly setter: render this with the bill's data to fill the top bar. */
export function BillTopbarSetter(props: BillHeader) {
  useBillTopbar(props);
  return null;
}

/** The shared /bill top bar: back link + panel toggle, then the active bill's context. */
export function BillTopbar() {
  const { header } = useContext(Ctx);
  const { collapsed, toggle, railSize } = useRailToggle();

  const title =
    header && header.vendorName && header.number
      ? `${header.vendorName} INV# ${header.number}`
      : header?.vendorName || header?.number || "New bill";

  return (
    <header className="flex h-12 shrink-0 items-center border-b bg-background">
      <div
        className="flex shrink-0 items-center gap-1 px-4"
        // Track the rail's width so the divider lines up with the rail/form border.
        style={{ width: `${railSize}%`, minWidth: "max-content" }}
      >
        <Link
          href="/main"
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Bill Pay
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Show bills list" : "Hide bills list"}
          aria-pressed={collapsed}
          className="ml-1 grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
        >
          <PanelLeft className="size-4" />
        </button>
      </div>

      {header ? (
        <div className="flex min-w-0 items-center gap-2.5 self-stretch border-l px-4">
          {header.vendorName ? (
            <VendorAvatar
              name={header.vendorName}
              img={header.vendorImg}
              className="size-7 text-[10px]"
            />
          ) : null}
          <span className="truncate text-sm">
            <span className="text-muted-foreground">{header.statusLabel}</span>{" "}
            <span className="font-semibold text-foreground">{title}</span>
          </span>
        </div>
      ) : null}

      <div className="ml-auto px-4">
        <Button asChild size="md">
          <Link
            href="/bill/new"
            // Start fresh — clear any draft being edited before creating a new one.
            onClick={() => useBillDraft.getState().reset()}
          >
            <Plus data-icon="inline-start" />
            New Bill
          </Link>
        </Button>
      </div>
    </header>
  );
}
