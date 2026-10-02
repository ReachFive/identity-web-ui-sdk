import * as React from "react"

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import type { ClassValue } from "clsx"

import { cn } from "@/lib/utils"

/**
 * A copy of CVA's own `ClassProp`: `class` and `className` are interchangeable, never both.
 *
 * It is re-declared here rather than imported because the package's `exports` map exposes
 * `class-variance-authority/types` under the `types` condition only — see {@link buttonVariants}.
 */
type ClassProp =
  | { class: ClassValue; className?: never }
  | { class?: never; className: ClassValue }
  | { class?: never; className?: never }

/** The variants accepted by {@link buttonVariants} — keep in sync with the `cva` config below. */
type ButtonVariants = {
  variant?: "default" | "outline" | "ghost" | "destructive" | "link"
  size?: "default" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"
}

/**
 * The return type is annotated rather than inferred: TypeScript would otherwise inline
 * `import("class-variance-authority/types").ClassProp` into the emitted declaration, and that
 * subpath is only declared under the `types` condition of the package's `exports` map, which
 * Rollup cannot resolve while bundling `types/identity-ui.d.ts`.
 *
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
const buttonVariants: (props?: ButtonVariants & ClassProp) => string = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-button-text-size font-button-font-weight leading-button transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-button-border-width border-button-border-color bg-button-bg text-button-text shadow-button-shadow hover:border-button-hover-border-color hover:bg-button-hover-bg hover:text-button-hover-text",
        // The label takes the *fill* color, not the border color: a tenant setting a hairline gray
        // `button.borderColor` would otherwise get a light gray label on white.
        outline:
          "border-button-border-width border-button-border-color bg-background text-button-bg shadow-button-shadow hover:border-button-hover-border-color hover:bg-button-subtle-bg",
        // Transparent rather than `bg-background`, so it stays invisible on any surface — it is
        // the default variant of `InputGroupButton`, where the field background may differ.
        ghost: "bg-transparent hover:bg-button-subtle-bg",
        destructive:
          "bg-destructive text-destructive-foreground shadow-button-shadow hover:bg-destructive/90",
        link: "text-link-text underline-offset-4 hover:text-link-hover-text hover:underline",
      },
      size: {
        default: "h-button-height px-button-padding-x py-button-padding-y",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "size-button-height",
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
