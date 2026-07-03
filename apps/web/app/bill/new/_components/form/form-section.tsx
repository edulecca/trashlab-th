import type { ReactNode } from "react";

import { SectionBadge } from "./section-badge";

/**
 * A titled form section with an optional completeness badge. The badge shows
 * only when `complete` is provided and the section is editable (not disabled).
 */
export function FormSection({
  title,
  complete,
  disabled = false,
  children,
}: {
  title: string;
  complete?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {complete !== undefined && !disabled ? (
          <SectionBadge complete={complete} />
        ) : null}
      </div>
      {children}
    </section>
  );
}
