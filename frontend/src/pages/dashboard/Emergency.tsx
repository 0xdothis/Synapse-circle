import Button from "@/components/ui/button"
import React from "react"
import Modal from "@/components/dashboard/Modal"
import { DialogClose } from "@/components/ui/dialog"
import { useNavigate } from "react-router"
import { useMutation } from "@tanstack/react-query"
import { cancelAlert } from "@/utils/safewalkFn"
import { useAlertStore } from "@/store/useAlertStore"
import { formatTime } from "@/utils/formatTime"
import { trackEvent } from "@/lib/mixpanelClient"
import { toast } from "sonner"



function Emergency() {
  const [seconds, setSeconds] = React.useState(0)
  const navigate = useNavigate();
  const activeAlertId = useAlertStore(state => state.activeAlertId)
  const clearActiveAlertId = useAlertStore(state => state.clearActiveAlertId)

  const { mutate: safeCancel } = useMutation({
    mutationFn: cancelAlert,
    onSuccess: (data) => {
      console.log("[SAFE ALERT]", data)
      if (!data.success) {
        trackEvent("alert_delivery_failed")
        return;
      }
      toast.success("Safe Email Dispatched")
      clearActiveAlertId()
      trackEvent("alert_delivery_confirmed")
      navigate("/dashboard/emergency-ended")
    },
    onError: (err) => {
      console.error(err)
    }

  })


  const { mutate: falseAlarm } = useMutation({
    mutationFn: cancelAlert,
    onSuccess: (data) => {
      if (!data.success) {
        trackEvent("alert_delivery_failed")
      }

      clearActiveAlertId();
      toast.info("False Alarm Email Dispatched")
      trackEvent("false_alarm_confirmed")
      navigate("/dashboard/false-alarm")
    },
    onError: (err) => {
      console.error(err)
    }

  })




  function handleFalseAlarm() {

    if (!activeAlertId) {
      return;
    }

    trackEvent("false_alarm_cancel_clicked")

    falseAlarm({ id: activeAlertId, reason: "false_alarm" })
  }



  function handleSafe() {

    if (!activeAlertId) {
      return;
    }


    if (seconds < 30) {
      return
    }

    trackEvent("alert_dispatched")


    safeCancel({ id: activeAlertId, reason: "resolved" })
  }


  React.useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])



  return (
    <section>
      <div className="flex flex-col items-center space-y-6 mb-30 py-8">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-bold text-danger-500">Emergency Active</h3>
          <p className="text-neutral-700 text-sm">📍 Live location sharing active</p>
        </div>
        <div className="font-extrabold text-5xl text-neutral-900 text-center flex justify-center items-center">
          {formatTime(seconds)}
        </div>
        <div className={`size-40 ${seconds > 30 ? "bg-success-200" : "bg-[#FEE2E2]"} rounded-full flex justify-center items-center mt-2`}>
          <Modal trigger={<Button variant="sos" className={`size-32.5 rounded-full text-3xl font-black flex flex-col justify-center items-center ${seconds > 30 && "bg-success-600 focus:bg-success-600 hover:bg-success-700 active:bg-success-600"}`}>SOS
            {seconds > 30 && <small className="text-sm">I'm Safe</small>}
          </Button>} title="End Emergency?" description="Are you sure you want to end this emergency session?">

            <div className="flex justify-between gap-2">
              <DialogClose render={<Button variant="sos" className="flex-1/2" onClick={handleSafe}>End Emergency</Button>} />
              <DialogClose render={<Button variant="outline" className="flex-1/2">Continue SOS</Button>} />
            </div>
          </Modal>
        </div>
        <p className="text-center text-neutral-700">{seconds > 30 ? "Tap the button above if you are safe to end." : "Emergency verified. Option to safely end will activate shortly."}</p>
      </div>
      <Modal trigger={<Button variant="sos" className="bg-danger-400 w-full focus:bg-danger-400 hover:bg-danger-500">False Alarm</Button>} title="False Alarm?" description="Are you sure this was a false alarm? Your trusted contacts and campus security will be informed that you are safe." >
        <div className="flex justify-between gap-2">
          <DialogClose render={<Button variant="outline" className="flex-1/2">Cancel</Button>} />
          <DialogClose render={<Button className="flex-1/2" onClick={handleFalseAlarm}>Yes, Cancel</Button>} />
        </div>
      </Modal>

    </section >
  )
}

export default Emergency
