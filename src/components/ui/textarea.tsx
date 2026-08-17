import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          // Reachfive's theme variables
          "h-[var(--r5-input-height)] px-[var(--r5-input-padding-x)] py-[var(--r5-input-padding-y)] text-[var(--r5-input-text)] text-[length:var(--r5-input-text-size)] leading-[var(--r5-input-leading)] rounded-[var(--r5-input-radius)] bg-[var(--r5-input-bg)] border-[var(--r5-input-border-color)] border-[length:var(--r5-input-border-width)] shadow-[shadow:var(--r5-input-shadow)] placeholder:text-[var(--r5-input-placeholder-text)] disabled:bg-[var(--r5-input-disabled-bg)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
