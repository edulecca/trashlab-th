import { cn } from "ui-system";

/** Two-letter initials from a vendor name, for the avatar fallback. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Circular vendor avatar — the vendor logo if present, else initials fallback. */
export function VendorAvatar({
  name,
  img,
  className,
}: {
  name: string;
  img: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border bg-muted text-xs font-semibold text-muted-foreground",
        className
      )}
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
}
