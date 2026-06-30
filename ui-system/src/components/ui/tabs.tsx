"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit items-center justify-center rounded-lg text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
      size: {
        md: "p-[3px] group-data-horizontal/tabs:h-8",
        lg: "gap-8 p-1.5 group-data-horizontal/tabs:h-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = React.useState<React.CSSProperties | null>(
    null
  )

  // Traveling underline: measure the active trigger and animate a single
  // shared indicator. Line variant only — the default variant uses a pill.
  useIsomorphicLayoutEffect(() => {
    const list = listRef.current
    if (!list || variant !== "line") {
      setIndicator(null)
      return
    }

    const INSET = 8 // keeps the line a touch shorter than the trigger

    const update = () => {
      const active = list.querySelector<HTMLElement>(
        '[data-slot="tabs-trigger"][data-state="active"]'
      )
      if (!active) {
        setIndicator(null)
        return
      }
      const vertical =
        list
          .closest("[data-slot=tabs]")
          ?.getAttribute("data-orientation") === "vertical"
      const listRect = list.getBoundingClientRect()
      const rect = active.getBoundingClientRect()
      setIndicator(
        vertical
          ? {
              top: rect.top - listRect.top + INSET,
              height: Math.max(rect.height - INSET * 2, 0),
              right: -4,
              width: 2,
            }
          : {
              left: rect.left - listRect.left + INSET,
              width: Math.max(rect.width - INSET * 2, 0),
              bottom: -5,
              height: 2,
            }
      )
    }

    update()

    const mo = new MutationObserver(update)
    mo.observe(list, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
    })
    const ro = new ResizeObserver(update)
    ro.observe(list)
    list
      .querySelectorAll('[data-slot="tabs-trigger"]')
      .forEach((trigger) => ro.observe(trigger))

    return () => {
      mo.disconnect()
      ro.disconnect()
    }
  }, [variant, size, children])

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      data-variant={variant}
      data-size={size}
      className={cn(tabsListVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      {indicator ? (
        <span
          aria-hidden
          data-slot="tabs-indicator"
          style={indicator}
          className="pointer-events-none absolute bg-foreground transition-all duration-300 ease-out"
        />
      ) : null}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-[state=inactive]:hover:underline group-data-[variant=line]/tabs-list:hover:underline-offset-4 dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
        "group-data-[size=lg]/tabs-list:gap-2 group-data-[size=lg]/tabs-list:px-4 group-data-[size=lg]/tabs-list:py-1 group-data-[size=lg]/tabs-list:text-base",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
