import DetailsTemplate from "@/components/dashboard/DetailsTemplate";
import { FullSpinner } from "@/components/Loader";
import { timeData } from "@/utils/formatTime";
import { alertDetail } from "@/utils/safewalkFn";
import { sentenceCase } from "@/utils/sentenceCase";
import { getStatus } from "@/utils/status";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "react-router"
import type { JSX } from "react/jsx-runtime";


function getTime(timestamp: string): string {
  const value = new Date(timestamp);

  const formatted = value.toLocaleString("en-GB", {
    minute: "2-digit",
    hour: "2-digit",
    hour12: true
  }).replace(/(am|pm)$/i, match => match.toUpperCase())

  return formatted
}

function getData(text: string, timestamp: string): JSX.Element {
  switch (text) {
    case "sos_activated":
      return (<div className="space-y-1">
        <h3 className="text-xs font-bold text-neutral-900">SOS Activated</h3>
        <p className="text-[10px] text-neutral-700">{`${getTime(timestamp)}`} • Manual trigger from Home</p>
      </div>
      )
    case "trusted_contacts_notified":
      return (<div className="space-y-1">
        <h3 className="text-xs font-bold text-neutral-900">Trusted Contacts Notified</h3>
        <p className="text-[10px] text-neutral-700">{`${getTime(timestamp)}`} • Alerts sent to your selected emergency contacts.</p>
      </div>
      )
    case "security_dispatched":
      return (<div className="space-y-1">
        <h3 className="text-xs font-bold text-neutral-900">Campus Security Notified</h3>
        <p className="text-[10px] text-neutral-700">{`${getTime(timestamp)}`} • Campus security dispatch notified and location shared.</p>
      </div>
      )
    case "location_tracking_started":
      return (<div className="space-y-1">
        <h3 className="text-xs font-bold text-neutral-900">Live Location Started</h3>
        <p className="text-[10px] text-neutral-700">{`${getTime(timestamp)}`} • Active mapping updates broadcasted</p>
      </div>
      )

    default:
      return (<div className="space-y-1">
        <h3 className="text-xs font-bold text-neutral-900">Emergency Ended</h3>
        <p className="text-[10px] text-neutral-700">{`${getTime(timestamp)}`} •  Response completed and incident marked as resolved.</p>
      </div>
      )




  }
}

function AlertDetail() {

  const { id } = useParams()

  const { data, isPending } = useSuspenseQuery({
    queryKey: ["alert", id],
    queryFn: () => alertDetail(id!)
  })


  if (isPending) {
    return <FullSpinner />
  }

  const { alert } = data

  console.log(alert)



  return (
    <div>
      <DetailsTemplate title="Alert Details" />

      <div className="pt-4 pb-30 space-y-4">
        <div className="border border-neutral-200 rounded-lg bg-white p-4 space-y-1">
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-xs text-neutral-700">{timeData(alert.cancelledAt)}</p>
            {getStatus(alert.cancellationReason)}
          </div>
          <div className="text-sm text-neutral-700 space-y-1">
            <p>{`📍 Location: ${alert.universityName}`}</p>
            <p>{`⏱️ Duration: ${Math.ceil(alert.durationMs / 60000)}`} Min</p>
          </div>
        </div>

        <div className="bg-neutral-100 rounded-lg p-3 space-y-1 ">
          <h3 className="text-xs text-neutral-700 font-semibold">READ-ONLY EMERGENCY MESSAGE</h3>
          <p className="text-sm text-neutral-900">{`"${alert.message}"`}</p>
        </div>

        <div className="space-y-4 p-3 bg-white border border-neutral-200 rounded-xl">
          <h3 className="text-neural-900 text-sm font-bold">Response Timeline</h3>
          <div>
            {alert.responseTimeline.map((res: { event: string, timestamp: string }, index: number) => (<div key={res.event} className="flex gap-4">
              <div className="flex flex-col items-center w-2">
                <div className="bg-brand-500 size-2.5 rounded-full" />
                {index !== alert.responseTimeline.length - 1 && <div className="w-0.5 h-8.5 bg-brand-200" />}
              </div>
              {getData(res.event, res.timestamp)}
            </div>))}
          </div>

        </div>

        <div className="space-y-3">
          <h3 className="text-neural-900 text-sm font-bold">Recipients Status</h3>
          <div>
            {alert.contactsNotified.map((contact: { type: string; relationship: string; status: string; name: string; }) => (
              <div className="mb-2">
                {contact.type === "trusted_contact" && (
                  <div className="p-3 border border-neutral-200 rounded-lg flex items-center justify-between" key={alert.id}>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">{contact.name} ({sentenceCase(contact.relationship)})</h3>
                      {contact.status === "sent" ? <p className="text-success-700 text-xs">Email Sent</p> : <p className="text-danger-700 text-xs">Email Failed</p>}
                    </div>
                    {contact.status === "sent" ? <div className="text-success-700">
                      <HugeiconsIcon icon={Tick01Icon} size={16} />
                    </div> :
                      <div className="text-danger-700">
                        <HugeiconsIcon icon={Tick01Icon} size={16} />
                      </div>
                    }
                  </div>
                )}

              </div>
            ))}
          </div>

        </div>

        <div className="space-y-1 bg-neutral-100 p-3 rounded-lg">
          <h4 className="text-xs font-bold text-neutral-900">Resolution Summary</h4>
          <p className="text-xs text-neutral-700">Resolution: Start {getTime(alert.resolutionSummary.startTime)}, End {getTime(alert.resolutionSummary.endTime)}. Resolved by {alert.resolutionSummary.resolvedBy}.</p>

        </div>

      </div>
    </div>

  )
}

export default AlertDetail;
