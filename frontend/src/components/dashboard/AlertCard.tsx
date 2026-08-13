

import type { AlertProps } from "./data"




function AlertCard({ alertInfo }: {
  alertInfo: AlertProps
}) {



  return (
    <div className="border border-neutral-200 rounded-lg bg-white p-4 space-y-1">
      <div className="flex justify-between items-center mb-1.5">
        <p className="text-xs text-neutral-700">{alertInfo.time}</p>
        <span className={`text-xs font-semibold ${alertInfo.tag === "Resolved" ? "bg-success-100 text-success-700 border-success-300" : "bg-danger-100 text-danger-700 border-danger-300"} py-0.5 px-1.5 border rounded-md`}>{alertInfo.tag}</span>
      </div>
      <h3 className="text-neutral-900 font-bold">{alertInfo.title}</h3>
      <div className="text-sm text-neutral-700 space-y-1">
        <p>{`📍 ${alertInfo.school}`}</p>
        <p>{`⏱️ Duration: ${alertInfo.duration}`}</p>
      </div>
    </div>
  )
}

export default AlertCard

