import * as React from "react"

import { cn } from "../../lib/utils"

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size"> {
  /** When set, renders the Ramp-style framed field with the label inside the box. */
  label?: React.ReactNode
  /** Appends a `*` to the label. */
  required?: boolean
  /** Content shown before the value (e.g. an icon). Forces the framed variant. */
  leftAccessory?: React.ReactNode
  /** Content shown after the value (e.g. a calendar icon). Forces the framed variant. */
  rightAccessory?: React.ReactNode
  /** Marks the field as invalid (red border + ring). */
  invalid?: boolean
  /** Class for the framed box; `className` always targets the inner `<input>`. */
  containerClassName?: string
}

const affixClass =
  "flex shrink-0 items-center text-muted-foreground [&_svg]:size-5"

function Input({
  className,
  type,
  label,
  required,
  leftAccessory,
  rightAccessory,
  invalid,
  containerClassName,
  id,
  disabled,
  ...props
}: InputProps) {
  const reactId = React.useId()
  const inputId = id ?? reactId
  const framed =
    label != null || leftAccessory != null || rightAccessory != null

  // Plain input — used for compact rows (line items, tax) with no inline label.
  if (!framed) {
    return (
      <input
        type={type}
        id={id}
        data-slot="input"
        aria-invalid={invalid || undefined}
        disabled={disabled}
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...props}
      />
    )
  }

  // Ramp-style framed field: fixed 60px, square corners, label inside the box,
  // optional left/right accessories. The box shows the focus ring; the inner
  // <input> is borderless and transparent.
  return (
    <div
      data-slot="input"
      data-disabled={disabled ? "" : undefined}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex h-[60px] items-center gap-3 rounded-none border border-input bg-background px-4 transition-colors",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-within:ring-destructive/20",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        containerClassName
      )}
    >
      {leftAccessory != null && (
        <span className={affixClass}>{leftAccessory}</span>
      )}

      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        {label != null && (
          <label
            htmlFor={inputId}
            className="pointer-events-none text-[13px] leading-none font-medium text-muted-foreground"
          >
            {label}
            {required ? (
              <span aria-hidden="true" className="text-muted-foreground">
                *
              </span>
            ) : null}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          disabled={disabled}
          className={cn(
            "w-full border-0 bg-transparent p-0 text-xl leading-tight text-foreground outline-none placeholder:text-muted-foreground/60",
            className
          )}
          {...props}
        />
      </span>

      {rightAccessory != null && (
        <span className={affixClass}>{rightAccessory}</span>
      )}
    </div>
  )
}

export { Input }
