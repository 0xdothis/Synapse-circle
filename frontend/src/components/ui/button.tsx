import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/utils/index';

const buttonVariants = cva(
  "inline-flex items-center justify-center font-semibold transition-all duration-200 ease-in-out", {
  variants: {
    variant: {
      primary: "bg-primary text-white hover:bg-brand-600 active:bg-brand-700 focus:bg-brand-500 disabled:bg-neutral-200 disabled:text-neutral-400",
      secondary: "bg-brand-100 text-brand-600 active:bg-brand-300 disabled:text-neutral-400 disabled:bg-neutral-100",
      outline: "bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100 focus:shadow-md disabled:text-neutral-400 disabled:border-neutral-200",
      ghost: "text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 focus:text-neutral-400 focus:shadow-md disabled:text-neutral-400",
      destructive: "bg-error text-white hover:bg-danger-600 focus:bg-danger-700 disabled:bg-neutral-200 disabled:text-neutral-400",
      sos: "bg-error text-white hover:bg-danger-600 focus:bg-danger-700 disabled:bg-neutral-300 disabled:text-neutral-400",

    },
    size: {
      sm: "text-sm rounded-md py-3 px-4",
      md: "text-sm rounded-lg px-5 py-3.5 ",
      lg: "text-md py-4 px-6 rounded-xl"

    }
  },
  defaultVariants: {
    variant: "primary",
    size: "lg",
  }
}

)

interface ButtonProps extends ComponentPropsWithoutRef<"button">, VariantProps<typeof buttonVariants> { }

function Button({ variant, size, className, children, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props}>{children}</button>
  )
}

export default Button;
