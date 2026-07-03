import { cn } from "ui-system";

/**
 * Round icon button for the bills toolbar (filter / columns / export, etc.).
 * App-internal on purpose: this is toolbar chrome, not a design-system primitive.
 * Works standalone or as an `asChild` trigger for a Popover / DropdownMenu.
 */
export function IconButton({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted-foreground/40 data-[state=open]:text-foreground disabled:pointer-events-none disabled:text-muted-foreground/50",
        className
      )}
      {...props}
    />
  );
}
