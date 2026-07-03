import { cn } from "../../lib/utils"

/**
 * Loading placeholder — a pulsing block sized by className. Compose it to shape
 * skeletons for cells, avatars, text lines, etc. (e.g. `h-4 w-24`, `size-9 rounded-full`).
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-muted-foreground/10",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
