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
          "h-[var(--input-height)] px-[var(--input-padding-x)] py-[var(--input-padding-y)] text-[var(--input-text-color)] text-[length:var(--input-text-size)] leading-[var(--input-leading)] rounded-[var(--input-radius)] bg-[var(--input-background)] border-[var(--input-border)] border-[length:var(--input-border-width)] placeholder:text-[var(--input-placeholder)] disabled:bg-[var(--input-disabled-background)]",
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
