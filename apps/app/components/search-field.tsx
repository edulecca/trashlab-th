"use client";

import { Search } from "lucide-react";
import { cn } from "ui-system";

type Size = "lg" | "sm";

// Borderless, transparent search field. `lg` is the bills toolbar hero search;
// `sm` is the compact variant (e.g. the new-bill left rail).
const SIZES: Record<Size, { wrap: string; icon: string; input: string }> = {
  lg: { wrap: "h-[65px] gap-3", icon: "size-5", input: "text-lg" },
  sm: { wrap: "h-9 gap-2", icon: "size-4", input: "text-sm" },
};

type SearchFieldProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  size?: Size;
  className?: string;
} & Omit<React.ComponentProps<"input">, "value" | "onChange" | "size" | "className">;

export function SearchField({
  value,
  onValueChange,
  size = "lg",
  className,
  placeholder = "Search…",
  ...props
}: SearchFieldProps) {
  const s = SIZES[size];
  return (
    <div className={cn("flex items-center", s.wrap, className)}>
      <Search className={cn("shrink-0 text-muted-foreground", s.icon)} />
      <input
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-full w-full border-0 bg-transparent p-0 outline-none placeholder:text-muted-foreground/70",
          s.input
        )}
        {...props}
      />
    </div>
  );
}
