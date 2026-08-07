import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "react-router";



function DetailsTemplate() {

  const navigate = useNavigate()

  return (

    <div className="flex flex-col flex-1 sticky bg-neutral-50 w-full py-6 top-0 z-50 border-b border-b-neutral-200">
      <button className="flex gap-2 text-neutral-900" onClick={() => navigate(-1)}>
        <HugeiconsIcon icon={ArrowLeft02Icon} />
        <p className="text-neutral-700 font-semibold">Hospital Details</p>
      </button>
    </div>
  )
}

export default DetailsTemplate;
