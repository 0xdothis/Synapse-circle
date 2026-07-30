import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import React from "react";
import { useNavigate } from "react-router";
import Button from "@/components/ui/button"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/utils";


interface BareBoneProps {
  icon?: IconSvgElement;
  heading: string;
  description: string;
  children: React.ReactNode,
  className?: string;
}


function BareBone({ icon, heading, description, className, children }: BareBoneProps) {
  const navigate = useNavigate()


  return (
    <>

      <Button className="self-start gap-2 lg:-ml-4" variant="ghost" onClick={() => navigate(-1)}> <HugeiconsIcon icon={ArrowLeft02Icon} /> Back</Button>

      <div className={cn("flex-1 flex flex-col justify-around", className)}>
        <div className="lg:hidden h-10" />
        <div className="space-y-8 flex flex-col items-center text-center">
          {icon && <div className="bg-brand-50 rounded-full w-30 h-30 text-primary flex justify-center items-center">
            <HugeiconsIcon icon={icon} size={60} />
          </div>}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-neutral-900">{heading}</h3>
            <p className="text-base text-neutral-700">{description}</p>
          </div>

          <div className="flex flex-1 flex-col w-full items-center">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}


export default BareBone
