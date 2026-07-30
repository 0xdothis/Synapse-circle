
import DashboardTemplate from "@/components/dashboard/DashboardTemplate";
import Button from "@/components/ui/button";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { useNavigate } from "react-router";



function EmergencyEnded() {
  const navigate = useNavigate()

  return (
    <section className="flex flex-col flex-1 space-y-8">

      <DashboardTemplate icon={Tick01Icon} title="Emergency Ended" description="Your alert has been saved to your history. Your trusted contacts and campus security have been notified that you are safe." className="bg-success-100 text-success-600">
        <div className="flex flex-col gap-4">
          <Button className="mt-4" onClick={() => navigate("/dashboard/history")}>View History</Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Return Home</Button>
        </div>
      </DashboardTemplate>


    </section>
  )
}

export default EmergencyEnded
