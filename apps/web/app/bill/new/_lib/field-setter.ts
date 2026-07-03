import type { ChangeEvent } from "react";

import type { DraftForm } from "@/stores/bill-draft";

/**
 * Builds per-field change handlers for the form sections. In disabled (view)
 * mode it returns `undefined`, so no handler crosses a server boundary.
 */
export function fieldSetter(
  disabled: boolean,
  onChange?: (key: keyof DraftForm, value: string) => void
) {
  return (key: keyof DraftForm) =>
    disabled
      ? undefined
      : (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          onChange?.(key, e.target.value);
}
