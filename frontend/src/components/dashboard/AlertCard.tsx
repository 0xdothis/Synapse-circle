

import type { AlertSchema } from "@/types"
import { timeData } from "@/utils/formatTime"
import { getStatus } from "@/utils/status"




function AlertCard({ alertInfo }: {
  alertInfo: AlertSchema
}) {


  return (
    <div className="border border-neutral-200 rounded-lg bg-white p-4 space-y-1">
      <div className="flex justify-between items-center mb-1.5">
        <p className="text-xs text-neutral-700">{timeData(alertInfo.cancelledAt)}</p>
        {getStatus(alertInfo.cancellationReason)}
      </div>
      <h3 className="text-neutral-900 font-bold">Emergency Alert</h3>
      <div className="text-sm text-neutral-700 space-y-1">
        <p>{`📍 ${alertInfo.universityName}`}</p>
        <p>{`⏱️ Duration: ${Math.ceil(alertInfo.durationMs / 60000)}`} Min</p>
      </div>
    </div>
  )
}

export default AlertCard

