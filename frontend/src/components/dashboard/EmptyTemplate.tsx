import Button from "@/components/ui/button";
import { NotificationOff01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "react-router";

type AlertHistoryProps = {
  title: string;
  description: string;
  CTA: string
}

function EmptyTemplate({ title, description, CTA }: AlertHistoryProps) {
  const navigate = useNavigate()

  return (
    <div className="text-center flex flex-col items-center space-y-8 px-4 py-10">
      <div className="size-30 flex justify-center items-center bg-neutral-100 rounded-full text-neutral-500">
        <HugeiconsIcon icon={NotificationOff01Icon} size={40} />
      </div>
      <div className="space-y-2">
        <h3 className="text-neutral-900 text-2xl font-bold">{title}</h3>
        <p className="text-neutral-700">{description}</p>
      </div>

      <Button size="lg" className="w-60" onClick={() => navigate("/dashboard")}>{CTA}</Button>
    </div>
  )
}


export default EmptyTemplate

