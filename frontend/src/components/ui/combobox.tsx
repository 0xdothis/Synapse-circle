import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/utils/index"
import Button from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  inputGroupVariants,
} from "@/components/ui/input-group"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

const Combobox = ComboboxPrimitive.Root

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
}

function ComboboxTrigger({
  className,
  size = "icon-xs",
  ...props
}: ComboboxPrimitive.Trigger.Props & { size?: "icon-xs" | "icon-sm" }) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      render={
        <InputGroupButton
          variant="ghost"
          size={size}
          className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
        />
      }
      {...props}
    >
      <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="pointer-events-none size-4 text-neutral-500" />
    </ComboboxPrimitive.Trigger>
  )
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      render={<InputGroupButton variant="ghost" size="icon-xs" />}
      className={cn(className)}
      {...props}
    >
      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  )
}

interface ComboboxInputProps
  extends Omit<ComboboxPrimitive.Input.Props, "size">,
  VariantProps<typeof inputGroupVariants> {
  showTrigger?: boolean
  showClear?: boolean
  disabled?: boolean
  "data-valid"?: boolean
  "data-invalid"?: boolean
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  size,
  required,
  "data-valid": dataValid,
  "data-invalid": dataInvalid,
  ...props
}: ComboboxInputProps) {
  return (
    <InputGroup className={cn("w-full", className)}>
      <ComboboxPrimitive.Input
        required={required}
        data-valid={dataValid || undefined}
        data-invalid={dataInvalid || undefined}
        render={<InputGroupInput disabled={disabled} size={size} />}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <ComboboxTrigger
            disabled={disabled}
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-neutral-50 data-pressed:shadow-none"
          />
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  )
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<ComboboxPrimitive.Positioner.Props, "side" | "align" | "sideOffset" | "alignOffset" | "anchor">) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            "group/combobox-content relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+var(--spacing)*7)] origin-(--transform-origin) overflow-hidden rounded-lg border border-neutral-200 bg-white text-neutral-900 shadow-lg duration-100 data-[chips=true]:min-w-(--anchor-width) data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:border-neutral-200 *:data-[slot=input-group]:bg-neutral-50 *:data-[slot=input-group]:shadow-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        "no-scrollbar max-h-[min(calc(var(--spacing)*72-var(--spacing)*9),calc(var(--available-height)-var(--spacing)*9))] scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0",
        className
      )}
      {...props}
    />
  )
}

function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md py-2 pr-8 pl-2.5 text-sm text-neutral-900 outline-hidden select-none data-highlighted:bg-neutral-100 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={<span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />}
      >
        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="pointer-events-none text-brand-500" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return <ComboboxPrimitive.Group data-slot="combobox-group" className={cn(className)} {...props} />
}

function ComboboxLabel({ className, ...props }: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn("px-2 py-1.5 text-xs text-neutral-500", className)}
      {...props}
    />
  )
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "hidden w-full justify-center py-2 text-center text-sm text-neutral-500 group-data-empty/combobox-content:flex",
        className
      )}
      {...props}
    />
  )
}

function ComboboxSeparator({ className, ...props }: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("-mx-1 my-1 h-px bg-neutral-200", className)}
      {...props}
    />
  )
}

function ComboboxChips({ className, ...props }: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> & ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-1 rounded-lg border border-neutral-300 bg-transparent bg-clip-padding px-3 py-1.5 text-sm transition-colors focus-within:border-brand-500 focus-within:border-2 has-aria-invalid:border-error has-aria-invalid:ring-2 has-aria-invalid:ring-error/20 has-data-[slot=combobox-chip]:px-1.5 dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

function ComboboxChip({ className, children, showRemove = true, ...props }: ComboboxPrimitive.Chip.Props & { showRemove?: boolean }) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "flex h-[5.25] w-fit items-center justify-center gap-1 rounded-sm bg-neutral-100 px-1.5 text-xs font-medium whitespace-nowrap text-neutral-900 has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0",
        className
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          render={<Button variant="ghost" size="sm" />}
          className="-ml-1 opacity-50 hover:opacity-100"
          data-slot="combobox-chip-remove"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="pointer-events-none" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  )
}

function ComboboxChipsInput({ className, ...props }: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn("min-w-16 flex-1 outline-none", className)}
      {...props}
    />
  )
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null)
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
}
