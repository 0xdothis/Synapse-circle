import DashboardTemplate from "@/components/dashboard/DashboardTemplate";
import Button from "@/components/ui/button";
import { NotificationOffIcon } from "@hugeicons/core-free-icons";
import { useNavigate } from "react-router";



function FasleAlarm() {
  const navigate = useNavigate()
  return (
    <section className="flex flex-col flex-1 space-y-8">

      <DashboardTemplate icon={NotificationOffIcon} title="False Alarm Notification Sent" description="Recipients have been notified to please disregard your previous emergency alert." className="bg-neutral-100 text-neutral-500">
        <Button className="mt-4" onClick={() => navigate("/dashboard/history")}>View History</Button>
      </DashboardTemplate>


    </section>
  )
}

export default FasleAlarm
