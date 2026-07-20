import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { cn } from "@/utils/index"

const inputVariants = cva(
  "flex w-full min-w-0 bg-transparent transition-colors outline-none file:inline-flex file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-neutral-400 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-50 disabled:border-neutral-200 dark:bg-input/30 dark:disabled:bg-input/80 border border-neutral-300 hover:border-neutral-400 focus:border-brand-500 focus:border-2 focus:text-neutral-900 user-valid:border-success user-invalid:border-error user-invalid:ring-2 user-invalid:ring-error/20",
  {
    variants: {
      size: {
        sm: "rounded-md px-3 py-2.5 text-sm file:h-5 file:text-xs",
        md: "rounded-lg px-4 py-3.5 text-sm file:h-6 file:text-sm",
        lg: "rounded-lg p-4 file:h-6",
      },
    },
    defaultVariants: {
      size: "lg",
    },
  }
)


export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
  VariantProps<typeof inputVariants> {
  startIcon?: IconSvgElement
  endIcon?: IconSvgElement
}

function Input({
  className,
  type,
  size,
  startIcon,
  endIcon,
  ...props
}: InputProps) {

  const input = (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        inputVariants({ size }),
        startIcon,
        endIcon,
        className
      )}
      {...props}
    />
  )

  if (!startIcon && !endIcon) return input

  return (
    <div data-slot="input-wrapper" className="relative flex w-full items-center">
      {startIcon && (
        <span className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
          <HugeiconsIcon icon={startIcon} size={24} />
        </span>
      )}
      {input}
      {endIcon && (
        <span className="pointer-events-none absolute right-3 flex items-center text-muted-foreground">
          <HugeiconsIcon icon={endIcon} size={24} />
        </span>
      )}
    </div>
  )
}

export { Input, inputVariants }
