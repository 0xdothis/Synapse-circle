import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import Button from "@/components/ui/button"

function Start() {

  return (
    <section className="flex-1">
      <div className="flex justify-between items center">
        <Button variant="ghost" size="sm"><HugeiconsIcon icon={ArrowLeft02Icon} /> Back</Button>
        <Button variant="ghost" size="sm"> Skip</Button>

      </div>

    </section>


  )
}

export default Start
