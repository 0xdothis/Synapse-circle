import DetailsTemplate from "@/components/dashboard/DetailsTemplate"
import Button from "@/components/ui/button"
import { Call02Icon, LocationIcon, NavigationIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"


function HospitalDetails() {
  return (
    <div>
      <DetailsTemplate />
      <div className="space-y-6 py-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-neutral-700 font-semibold text-sm">Teaching Hospital</p>
            <span className="bg-neutral-100 rounded-sm px-2 py-0.5 text-neutral-900 font-semibold text-xs border border-neutral-200">Open 24hrs</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900">University of Ilorin Teaching Hospital</h2>
        </div>
        <div className="p-3 border border-neutral-200 bg-white grid grid-cols-[1fr_20px_1fr] grid-rows-1 justify-between rounded-lg">
          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-700">DISTANCE</p>
            <p className="text-sm text-neutral-900 font-bold">0.8 km</p>
          </div>
          <div className="w-0.5 bg-neutral-200 " />
          <div className=" space-y-1">
            <p className="text-xs font-medium text-neutral-700">DRIVE TIME</p>
            <p className="text-sm text-neutral-900 font-bold">3 mins</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-neutral-600">
            <HugeiconsIcon icon={LocationIcon} size={16} />
            <p className="text-neutral-900 text-sm">Oke-Ose, PMB 1515, Ilorin, Nigeria</p>
          </div>
          <div className="flex items-center gap-2 text-neutral-600">
            <HugeiconsIcon icon={Call02Icon} size={16} />
            <p className="text-neutral-900 text-sm">+234 803 123 4567</p>
          </div>

        </div>
        <div>
          <h3 className="text-sm font-bold text-neutral-900">Overview</h3>
          <p className="text-sm text-neutral-700">A major federal healthcare facility providing advanced tertiary medical services, emergency care, and specialty treatments. Equipped with emergency response units and specialized departments open to the public 24/7.</p>
        </div>
        <div className="flex flex-col gap-4">
          <Button className="gap-2 text-sm font-bold">
            <HugeiconsIcon icon={NavigationIcon} size={20} />
            Get Directions</Button>
          <Button variant="outline" className="gap-2 text-sm font-bold">
            <HugeiconsIcon icon={Call02Icon} size={20} />
            Call Hospital</Button>

        </div>
      </div >
    </div >
  )
}

export default HospitalDetails

