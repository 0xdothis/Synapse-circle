import { cn } from "@/utils";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

interface DashboardTemplateProps {
  title: string;
  description: string;
  icon: IconSvgElement;
  children: React.ReactNode;
  className?: string;
}


function DashboardTemplate({ icon, description, title, className, children }: DashboardTemplateProps) {
  return (
    <div className="flex flex-col flex-1 justify-center items-center space-y-8">
      <div className={cn("rounded-full w-30 h-30 text-primary flex justify-center items-center", className)}>
        <HugeiconsIcon icon={icon} size={60} />
      </div>
      <div className="space-y-3 text-center">
        <h3 className="text-2xl font-bold text-neutral-900">{title}</h3>
        <p className="text-base text-center text-neutral-700"> {description}</p>
      </div>


      <div className=" flex flex-col space-y-2 lg:px-8 w-full">
        {children}
      </div>
    </div>

  )
}

export default DashboardTemplate
