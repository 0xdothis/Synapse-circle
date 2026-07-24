import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/index"

const textareaVariants = cva(
  "flex field-sizing-content w-full bg-transparent transition-colors outline-none placeholder:text-neutral-400 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-50 disabled:border-neutral-200 dark:bg-input/30 dark:disabled:bg-input/80 border border-neutral-300 hover:border-neutral-400 focus:border-brand-500 focus:border-2 focus:text-neutral-900 user-valid:border-success user-invalid:border-error user-invalid:ring-2 user-invalid:ring-error/20",
  {
    variants: {
      size: {
        sm: "min-h-14 rounded-md px-3 py-2.5 text-sm",
        md: "min-h-16 rounded-lg px-4 py-3.5 text-sm",
        lg: "min-h-20 rounded-lg p-4",
      },
    },
    defaultVariants: {
      size: "lg",
    },
  }
)

export interface TextareaProps
  extends Omit<React.ComponentProps<"textarea">, "size">,
  VariantProps<typeof textareaVariants> { }

function Textarea({ className, size, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ size }), className)}
      {...props}
    />
  )
}

export { Textarea, textareaVariants }
