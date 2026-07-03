import { RailToggleProvider } from "@/components/rail-toggle";
import { BillTopbar, BillTopbarProvider } from "./_components/bill-topbar";

/**
 * Full-screen chrome for the /bill section. Deliberately does NOT reuse the
 * /main BackofficeLayout — no navigation sidebar here. The route sits as a
 * sibling of /main so it inherits none of that shell.
 *
 * This layout owns the shared frame (full-height + the top bar). The top bar
 * shows a way back plus the active bill's context, which each page publishes
 * via the BillTopbar context. Each page fills the region below with its columns.
 */
export default function BillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RailToggleProvider>
      <BillTopbarProvider>
        <div className="flex h-svh flex-col bg-muted/20">
          <BillTopbar />
          <div className="flex min-h-0 flex-1">{children}</div>
        </div>
      </BillTopbarProvider>
    </RailToggleProvider>
  );
}
