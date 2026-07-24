import Button from "@/components/ui/button"
import { Compass } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useNavigate } from "react-router"


function ErrorPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-3xl min-h-screen mx-auto">
      <div className="h-30 w-30 flex justify-center items-center bg-brand-100 text-primary rounded-full mb-6">
        <HugeiconsIcon icon={Compass} size={64} />
      </div>
      <div className="text-center space-y-4">
        <h2 className="font-bold text-primary text-[3.5rem]">404</h2>
        <h3 className="font-bold text-neutral-900 text-2xl">Oops! We couldn't find that page.</h3>

        <div className="font-medium text-neutral-700 text-sm space-y-6">
          <p>The page you're looking for may have been moved, deleted, or the link may be incorrect.</p>
          <p>Don't worry. Your account and emergency information are safe.</p>
        </div>
      </div>
      <div className="flex flex-col w-full gap-3 mt-6">
        <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        <Button variant="ghost" onClick={() => navigate(-1)}>Go Back</Button>

      </div>
    </div>
  )
}

export default ErrorPage
