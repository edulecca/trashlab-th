import { ListItem } from "ui-system";

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

function VendorAvatar({ name, img }: { name: string; img: string | null }) {
  return (
    <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border bg-muted text-xs font-semibold text-muted-foreground">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export type VendorElementRowProps = {
  vendor: string;
  img: string | null;
  uploadedBy: string;
  uploadedAt: string;
};

/**
 * The Vendor cell for the bills table: a circular avatar (vendor logo or
 * initials fallback), the vendor name, and — underneath — who uploaded the
 * bill and when.
 */
export function VendorElementRow({
  vendor,
  img,
  uploadedBy,
  uploadedAt,
}: VendorElementRowProps) {
  return (
    <ListItem
      className="gap-3 px-0 py-0"
      leftAccessory={<VendorAvatar name={vendor} img={img} />}
      title={vendor}
      subtitle={`${uploadedBy} · ${formatDate(uploadedAt)}`}
    />
  );
}
