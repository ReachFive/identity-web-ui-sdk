import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          // Reachfive's theme variables
          "h-[var(--r5-input-height)] px-[var(--r5-input-padding-x)] py-[var(--r5-input-padding-y)] text-[var(--r5-input-text)] text-[length:var(--r5-input-text-size)] leading-[var(--r5-input-leading)] rounded-[var(--r5-input-radius)] bg-[var(--r5-input-bg)] border-[var(--r5-input-border-color)] border-[length:var(--r5-input-border-width)] placeholder:text-[var(--r5-input-placeholder-text)] disabled:bg-[var(--r5-input-disabled-bg)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
