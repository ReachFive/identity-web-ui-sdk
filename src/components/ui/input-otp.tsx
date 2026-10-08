import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"
import { OTPInput, OTPInputContext } from "input-otp"
import { Minus } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      // Reachfive: the disabled state is carried by the slots themselves
      "w-full has-[:disabled]:opacity-100",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center",
      // Reachfive: one box per digit, spread over the whole width
      "w-full gap-[var(--spacing)]",
      className
    )}
    {...props}
  />
))
InputOTPGroup.displayName = "InputOTPGroup"

const inputOTPSlotVariants = cva(
  [
    // Reachfive: separate boxes instead of shadcn's joined group (`border-y border-r first:border-l …`)
    "relative flex items-center justify-center shadow-sm transition-all",
    // Reachfive's theme variables
    "h-[var(--r5-input-height)] min-w-0 flex-1 rounded-lg bg-[var(--r5-input-bg)] border-[var(--r5-input-border-color)] border-[length:var(--r5-input-border-width)] text-[var(--r5-input-text)] text-[length:calc(var(--r5-input-text-size)*1.5)] shadow-[shadow:var(--r5-input-shadow)]",
  ],
  {
    variants: {
      status: {
        error: "border-destructive bg-destructive/5 text-destructive",
        success: "border-success bg-success/5 text-success",
        disabled: "bg-[var(--r5-input-disabled-bg)] text-muted-foreground",
      },
      active: {
        true: "z-10 ring-1 ring-ring",
      },
    },
  }
)

type InputOTPSlotStatus = NonNullable<VariantProps<typeof inputOTPSlotVariants>["status"]>

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number; status?: InputOTPSlotStatus }
>(({ index, status, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      data-active={isActive}
      data-status={status}
      className={cn(inputOTPSlotVariants({ status, active: isActive }), className)}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Minus />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator, type InputOTPSlotStatus }
