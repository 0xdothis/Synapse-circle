

import DashboardTemplate from "@/components/dashboard/DashboardTemplate";
import Button from "@/components/ui/button";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useNavigate } from "react-router";



function EmergencyCancelled() {
  const navigate = useNavigate()

  return (
    <section className="flex flex-col flex-1 space-y-8">

      <DashboardTemplate icon={Cancel01Icon} title="Alert Cancelled" description="No emergency alert was sent" className="bg-danger-100 text-danger-600">
        <div className="flex flex-col gap-4">

          <Button onClick={() => navigate("/dashboard")}>Return Home</Button>
        </div>
      </DashboardTemplate>


    </section>
  )
}

export default EmergencyCancelled
