import type { JSX } from "react";

export function getStatus(status: string): JSX.Element {
  switch (status) {
    case "resolved":
      return (<span className="text-xs font-semibold bg-success-100 text-success-700 border-success-300 py-0.5 px-1.5 border rounded-md">Resolved</span>)
    case "false_alarm":
      return (
        <span className="bg-danger-100 text-danger-700 text-xs font-semibold border-danger-300 py-0.5 px-1.5 border rounded-md">False Alarm</span>
      )

    default:
      return (<span className="text-xs font-semibold bg-info-100 border-info-300 text-info-700 py-0.5 px-1.5 border rounded-md
">Cancelled</span>
      )

  }
}

