import { Badge } from "ui-system";

/** Small completeness pill shown next to a form section heading. */
export function SectionBadge({ complete }: { complete: boolean }) {
  return complete ? (
    <Badge variant="success">Complete</Badge>
  ) : (
    <Badge variant="secondary">Missing info</Badge>
  );
}
