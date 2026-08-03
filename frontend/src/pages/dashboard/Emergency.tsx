import Button from "@/components/ui/button"
import React from "react"
import Modal from "@/components/dashboard/Modal"
import { DialogClose } from "@/components/ui/dialog"
import { useNavigate } from "react-router"



function Emergency() {
  const [seconds, setSeconds] = React.useState(0)
  const navigate = useNavigate()

  function handleNavigate() {
    navigate("/dashboard/false-alarm");
  }

  function handleSafe() {

    if (seconds <= 30) {
      return
    }


    navigate("/dashboard/emergency-ended")
  }


  React.useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])


  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    const paddedmins = String(mins).padStart(2, "0");
    const paddedSecs = String(secs).padStart(2, "0")

    return `${paddedmins}:${paddedSecs}`
  }



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
          <DialogClose render={<Button className="flex-1/2" onClick={handleNavigate}>Yes, Cancel</Button>} />
        </div>
      </Modal>

    </section >
  )
}

export default Emergency
