import React from "react"
import Pill from "./ui/Pill";
import { cn } from "@/utils"

interface Props {
  title: string;
  heading: string;
  description: string;
  className?: string;
  children: React.ReactNode
}

function Segment({ title, heading, className, description, children }: Props) {

  return (
    <section className={cn("mt-14", className)}>
      <div className="flex flex-col justify-center items-center text-center space-y-3">
        <Pill text={title} />
        <h3 className="text-2xl font-bold text-neutral-900">{heading}</h3>
        <p className="text-default">{description}</p>
      </div>
      <div className="mt-10">{children}</div>
    </section>

  )
}

export default Segment;
