import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import React from "react";
import { useNavigate } from "react-router";

import Button from "@/components/ui/button"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";


interface BareBoneProps {
  icon: IconSvgElement;
  heading: string;
  description: string;
  children: React.ReactNode
}

function BareBone({ icon, heading, description, children }: BareBoneProps) {
  const navigate = useNavigate()

  return (
    <section>

      <Button className="self-start gap-2" variant="ghost" onClick={() => navigate(-1)}> <HugeiconsIcon icon={ArrowLeft02Icon} /> Back</Button>

      <div>
        <div>
          <div>
            <HugeiconsIcon icon={icon} size={60} />
          </div>
          <h3>{heading}</h3>
          <p>{description}</p>
        </div>
        <div>
          {children}
        </div>
      </div>
    </section>
  )
}

export default BareBone
