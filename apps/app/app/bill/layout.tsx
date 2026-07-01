import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Full-screen chrome for the /bill section. Deliberately does NOT reuse the
 * /main BackofficeLayout — no navigation sidebar here. The route sits as a
 * sibling of /main so it inherits none of that shell.
 *
 * This layout owns the shared frame (full-height, top bar with a way back to
 * the bills list). Each /bill page fills the region below with its own columns.
 */
export default function BillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-svh flex-col bg-muted/20">
      <header className="flex h-12 shrink-0 items-center border-b bg-background px-4">
        <Link
          href="/main"
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Bill Pay
        </Link>
      </header>
      <div className="flex min-h-0 flex-1">{children}</div>
    </div>
  );
}
