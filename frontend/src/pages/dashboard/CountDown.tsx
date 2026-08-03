import Header from "@/components/dashboard/Header"
import Button from "@/components/ui/button"
import React from "react"
import { useNavigate } from "react-router";


function CountDown() {
  const [timer, setTimer] = React.useState(5);
  const navigate = useNavigate()

  React.useEffect(() => {

    if (timer <= 0) {
      navigate("/dashboard/emergency")
    };

    const countdown = setTimeout(() => {
      setTimer(prev => prev - 1)
    }, 1000);


    return () => clearTimeout(countdown);



  }, [timer])
  return (
    <section className="relative pt-4 pb-16 flex flex-col flex-1 min-h-screen items-center">
      <Header title="Emergency Countdown" caption="Hold tight, help is on the way" className="flex-col-reverse" />

      <div className="flex flex-col flex-1 h-full items-center justify-center ">
        <div className="flex flex-col items-center mb-20">
          <div className="text-center space-y-2 mb-8">
            <h3 className="text-danger-500 text-2xl font-bold">Emergency Alert</h3>
            <p className="text-neutral-700">Sending alert in: </p>
          </div>
          <div className="size-40 rounded-full bg-[#FEE2E2] flex justify-center items-center text-6xl text-danger-500 font-bold">
            {timer}
          </div>
        </div>
        <Button variant="outline" className="w-70" onClick={() => navigate("/dashboard/emergency-cancelled")}>Cancel</Button>
      </div>
    </section>
  )
}

export default CountDown
