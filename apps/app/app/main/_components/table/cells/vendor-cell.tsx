import { ListItem } from "ui-system";

import { VendorAvatar } from "@/components/vendor-avatar";
import { formatDate } from "@/lib/format";

export type VendorCellProps = {
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
export function VendorCell({
  vendor,
  img,
  uploadedBy,
  uploadedAt,
}: VendorCellProps) {
  return (
    <ListItem
      className="gap-3 px-0 py-0"
      leftAccessory={<VendorAvatar name={vendor} img={img} />}
      title={vendor}
      subtitle={`${uploadedBy} · ${formatDate(uploadedAt)}`}
    />
  );
}
