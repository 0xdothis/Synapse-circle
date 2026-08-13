import { Call02Icon, ClockIcon, LocationIcon, NavigationIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Button from "@/components/ui/button"
import type { HospitalProps } from "./data"




function DirectoryCard({ hospitalInfo }: { hospitalInfo: HospitalProps }) {



  return (
    <div className="border border-neutral-200 rounded-lg bg-white p-4 space-y-3">
      <div className="flex justify-between items-center mb-1.5">
        <div className=" flex justify-between gap-1.5 items-center">
          {hospitalInfo?.tag && <span className="bg-neutral-100 text-neutral-900 font-bold px-1.5 py-0.5 text-[0.625rem] rounded-sm">{hospitalInfo.tag.toUpperCase()}</span>}
          <p className="text-xs font-semibold text-neutral-700">{hospitalInfo.type}</p>
        </div>
        <span className="text-[0.625rem] font-semibold bg-neutral-200 text-neutral-900 py-0.5 px-1.5 rounded-sm">{hospitalInfo.operatingHour}</span>
      </div>
      <h3 className="text-neutral-900 font-bold">{hospitalInfo.name}</h3>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-neutral-700 text-sm">
          <HugeiconsIcon icon={LocationIcon} size={16} />
          <span>{`${hospitalInfo.distance.km} km`}</span>
        </div>

        <div className="flex items-center gap-1 text-neutral-700 text-sm">
          <HugeiconsIcon icon={ClockIcon} size={16} />
          <span>{`${hospitalInfo.distance.drive} min drive`}</span>
        </div>
      </div>
      <div className="text-sm text-neutral-700 space-y-1">
        <p>{hospitalInfo.address}</p>
        <p>Tel: {hospitalInfo.tel}</p>
      </div>
      <div className="flex gap-2">
        <Button className="gap-2 text-sm font-bold flex-1/2">
          <HugeiconsIcon icon={NavigationIcon} size={18} />
          Get Directions</Button>
        <Button variant="outline" className="gap-2 text-sm font-bold flex-1/2">
          <HugeiconsIcon icon={Call02Icon} size={18} />
          Call Hospital</Button>

      </div>
    </div>
  )
}

export default DirectoryCard
