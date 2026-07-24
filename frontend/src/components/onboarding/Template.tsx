import React from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";


interface TemplateProps {
  heading: string | boolean;
  description: string | boolean;
  icon?: IconSvgElement;
  image?: string;
  children: React.ReactNode

}


function Template({ heading, description, image, icon, children }: TemplateProps) {



  return (
    <div className="flex flex-col flex-1">

      <div className="space-y-8 flex flex-col items-center text-center mt-auto">
        {image && <div className="h-32">
          <img src={image} alt="safewalk logo light" className="h-full" />
        </div>}
        {icon && <div className="bg-brand-50 rounded-full w-30 h-30 text-primary flex justify-center items-center">
          <HugeiconsIcon icon={icon} size={60} />
        </div>}
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-neutral-900">{heading}</h3>
          <p className="text-base text-neutral-700">{heading === "Location Sharing Disabled" ? <>
            {description}
            <ul className="list-decimal list-inside">
              <li>Click "Enable Location" on the SafeWalk page</li>
              <li>our browser will ask to allow location access - click "Allow"</li>
              <li>Your nearby walks will appear automatically</li>
            </ul>

          </> : description}

          </p>
        </div>
      </div>


      <div className=" flex flex-col space-y-2 mt-auto lg:px-8">
        {children}
      </div>
    </div>
  )
}

export default Template
