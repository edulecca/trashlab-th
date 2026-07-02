import * as React from "react"

import { cn } from "../../lib/utils"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  /** When set, renders the Ramp-style framed field with the label inside the box. */
  label?: React.ReactNode
  /** Appends a `*` to the label. */
  required?: boolean
  /** Marks the field as invalid (red border + ring). */
  invalid?: boolean
  /** Class for the framed box; `className` always targets the inner `<textarea>`. */
  containerClassName?: string
}

function Textarea({
  className,
  label,
  required,
  invalid,
  containerClassName,
  id,
  disabled,
  rows = 3,
  ...props
}: TextareaProps) {
  const reactId = React.useId()
  const textareaId = id ?? reactId

  // Plain textarea — no inline label.
  if (label == null) {
    return (
      <textarea
        id={id}
        data-slot="textarea"
        aria-invalid={invalid || undefined}
        disabled={disabled}
        rows={rows}
        className={cn(
          "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...props}
      />
    )
  }

  // Ramp-style framed field: same squared, inline-labelled box as Input, but
  // grows vertically for multi-line content (min height 60px).
  return (
    <div
      data-slot="textarea"
      data-disabled={disabled ? "" : undefined}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex min-h-[60px] flex-col justify-center gap-1 rounded-none border border-input bg-background px-4 py-2.5 transition-colors",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-within:ring-destructive/20",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        containerClassName
      )}
    >
      <label
        htmlFor={textareaId}
        className="pointer-events-none text-[13px] leading-none font-medium text-muted-foreground"
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="text-muted-foreground">
            *
          </span>
        ) : null}
      </label>
      <textarea
        id={textareaId}
        disabled={disabled}
        rows={rows}
        className={cn(
          "w-full resize-none border-0 bg-transparent p-0 text-xl leading-snug text-foreground outline-none placeholder:text-muted-foreground/60",
          className
        )}
        {...props}
      />
    </div>
  )
}

export { Textarea }
