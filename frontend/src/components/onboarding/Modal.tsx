import Button from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import React from "react"


interface ModalProps {
  icon: IconSvgElement,
  title: string;
  description: string;
  iconColor?: string;
  trigger: string;
  children: React.ReactNode
}

export function Modal({ icon, title, description, trigger, iconColor = "danger", children }: ModalProps) {
  return (
    <Dialog>
      <form>
        {trigger && <DialogTrigger className="w-full" render={<Button variant="ghost">{trigger}</Button>} />}
        <DialogContent className="sm:max-w-sm space-y-6 flex flex-col justify-center items-center" showCloseButton={false}>
          <DialogHeader className="text-center flex flex-col justify-center items-center">
            <div className={`h-16 w-16 rounded-full flex justify-center items-center bg-${iconColor}-100 text-${iconColor}-500`} >
              <HugeiconsIcon icon={icon} size={32} />
            </div>
            <DialogTitle className="font-bold text-2xl text-neutral-900">{title}</DialogTitle>
            <DialogDescription className="text-neutral-700">
              {description}

            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col-reverse w-full gap-2">
            {children}
          </div>
        </DialogContent>
      </form>
    </Dialog >
  )
}

export default Modal

