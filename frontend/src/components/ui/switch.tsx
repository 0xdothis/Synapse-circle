import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/index"

const switchVariants = cva(
  "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-error aria-invalid:ring-3 aria-invalid:ring-error/20 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-unchecked:bg-neutral-200 dark:data-unchecked:bg-neutral-700",
  {
    variants: {
      variant: {
        primary: "data-checked:bg-primary",
        danger: "data-checked:bg-error",
      },
      size: {
        sm: "h-[14px] w-[24px]",
        md: "h-[18.4px] w-[32px]",
        lg: "h-[24px] w-[44px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

const switchThumbVariants = cva(
  "pointer-events-none block rounded-full bg-white ring-0 transition-transform",
  {
    variants: {
      size: {
        sm: "size-3 data-checked:translate-x-[calc(100%-2px)] data-unchecked:translate-x-0",
        md: "size-4 data-checked:translate-x-[calc(100%-2px)] data-unchecked:translate-x-0",
        lg: "size-5 data-checked:translate-x-[calc(100%-2px)] data-unchecked:translate-x-0",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)
interface SwitchProps
  extends SwitchPrimitive.Root.Props,
  VariantProps<typeof switchVariants> { }

function Switch({ className, variant, size, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchVariants({ variant, size }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(switchThumbVariants({ size }))}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch, switchVariants }
