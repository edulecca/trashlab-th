"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Menu, Receipt, Users, Wallet, X } from "lucide-react";
import { cn } from "ui-system";

const nav = [
  { href: "/main", label: "Bills", icon: Receipt },
  { href: "/main/vendors", label: "Vendors", icon: Users },
  { href: "/main/payments", label: "Payments", icon: CreditCard },
];

function Brand() {
  return (
    <div className="flex h-14 items-center gap-2 px-4">
      <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
        <Wallet className="size-4" />
      </span>
      <span className="font-semibold tracking-tight">trashlab</span>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {nav.map((item) => {
        const active =
          item.href === "/main"
            ? pathname === "/main"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-muted md:flex">
        <Brand />
        <NavLinks />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-muted transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between pr-2">
          <Brand />
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <NavLinks onNavigate={() => setOpen(false)} />
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b bg-background px-4 md:hidden">
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-semibold tracking-tight">trashlab</span>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
