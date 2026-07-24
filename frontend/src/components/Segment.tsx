import React from "react"
import Pill from "./ui/Pill";
import { cn } from "@/utils"

interface Props {
  title: string;
  heading: string;
  description: string;
  className?: string;
  children: React.ReactNode,
  id: string
}

function Segment({ id, title, heading, className, description, children }: Props) {

  return (
    <section id={id} className={cn("mt-14 scroll-mt-20 lg:scroll-mt-30", className)}>
      <div className="flex flex-col justify-center items-center text-center space-y-3">
        <Pill text={title} />
        <h3 className="text-2xl font-bold text-neutral-900 lg:text-4xl">{heading}</h3>
        <p className="text-neutral-700 lg:text-[1.125rem]">{description}</p>
      </div>
      <div className="mt-10">{children}</div>
    </section>

  )
}

export default Segment;
