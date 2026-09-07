import * as React from "react"

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * `theme.button.*` describes the *filled* button, and the other variants derive from it — so a
 * tenant who themes the button sees `outline` and `ghost` follow, instead of drifting back to the
 * brand color. Setting `primaryColor` alone is enough, since the `--r5-button-*` tokens point at
 * the palette until an option overrides them.
 *
 * `outline` and `ghost` hover onto `--r5-button-subtle-bg`, a low-alpha tint of the button color.
 * That keeps shadcn's intent — a neutral interactive surface, its `accent` role — while tracking
 * the tenant's own color rather than a fixed gray.
 *
 * The border width sits on the variants that draw a border rather than on the base, so `ghost`,
 * `link` and `destructive` do not inherit a width with no matching color, which resolves to
 * `currentColor` and paints a hairline in the text color.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--r5-button-radius)] text-[length:var(--r5-button-text-size)] font-[var(--r5-button-font-weight)] leading-[var(--r5-button-leading)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-[length:var(--r5-button-border-width)] border-[var(--r5-button-border-color)] bg-[var(--r5-button-bg)] text-[var(--r5-button-text)] shadow-[shadow:var(--r5-button-shadow)] hover:border-[var(--r5-button-hover-border-color)] hover:bg-[var(--r5-button-hover-bg)] hover:text-[var(--r5-button-hover-text)]",
        // The label takes the *fill* color, not the border color: a tenant setting a hairline gray
        // `button.borderColor` would otherwise get a light gray label on white.
        outline:
          "border-[length:var(--r5-button-border-width)] border-[var(--r5-button-border-color)] bg-background text-[var(--r5-button-bg)] shadow-[shadow:var(--r5-button-shadow)] hover:border-[var(--r5-button-hover-border-color)] hover:bg-[var(--r5-button-subtle-bg)]",
        // Transparent rather than `bg-background`, so it stays invisible on any surface — it is
        // the default variant of `InputGroupButton`, where the field background may differ.
        ghost: "bg-transparent hover:bg-[var(--r5-button-subtle-bg)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[shadow:var(--r5-button-shadow)] hover:bg-destructive/90",
        link: "text-[var(--r5-link-text)] underline-offset-4 hover:text-[var(--r5-link-hover-text)] hover:underline",
      },
      size: {
        default:
          "h-[var(--r5-button-height)] px-[var(--r5-button-padding-x)] py-[var(--r5-button-padding-y)]",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "size-[var(--r5-button-height)]",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
