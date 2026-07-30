
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import React from "react"


interface ModalProps {
  title: string;
  description: string;
  trigger: React.ReactElement;
  children: React.ReactNode
}

export function Modal({ title, description, trigger, children }: ModalProps) {
  return (
    <Dialog>

      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-sm space-y-6 flex flex-col justify-center items-center" showCloseButton={false}>
        <DialogHeader className="text-center flex flex-col justify-center items-center">
          <DialogTitle className="font-bold text-2xl text-neutral-900">{title}</DialogTitle>
          <DialogDescription className="text-neutral-700">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col-reverse w-full gap-2">
          {children}
        </div>
      </DialogContent>
    </Dialog >
  )
}

export default Modal

