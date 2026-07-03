import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "ui-system";

/**
 * Root 404 — rendered for unmatched routes and `notFound()` calls. Themed to
 * the app (trashlab): the page got taken out with the trash.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-primary px-6 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-primary-foreground/10">
        <Trash2 className="size-8 text-primary-foreground" />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-primary-foreground/70 uppercase">
          404
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary-foreground">
          Your trash was moved
        </h1>
        <p className="max-w-md text-primary-foreground/80">
          This page got taken out — the link is broken or the page no longer
          exists.
        </p>
      </div>

      <Button asChild size="lg" variant="secondary">
        <Link href="/main">Back to Bills</Link>
      </Button>
    </div>
  );
}
