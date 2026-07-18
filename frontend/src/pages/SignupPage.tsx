import Button from "@/components/ui/button"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import ladyMobile from "../assets/signup/lady_mobile.png"
import Link from "@/components/ui/Link"
import Terms from "@/components/ui/Terms"
import { useNavigate } from "react-router"

function SignupPage() {
  const navigate = useNavigate()
  return (
    <div className="h-full space-y-6 py-4 bg-neutral-50">
      <Button className="gap-2" variant="ghost" size="sm" onClick={() => navigate("/")}>
        <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
        Back to landing page
      </Button>

      <div>
        <img src={ladyMobile} className="w-full" />
      </div>

      <div className="w-full flex flex-col items-center text-center space-y-4">
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-neutral-900">Create your account</h3>
          <p className="text-neutral-700">Stay connected with trusted contacts and campus security.</p>
        </div>
        <div className="flex flex-col w-full space-y-4">
          <Link to="signup/google" variant="outline" size="sm">Continue with Google</Link>
          <small className="text-center text-xs text-neutral-400">OR</small>
          <Link to="email" variant="secondary" size="sm">Continue with Email</Link>
        </div>
        <Terms />
      </div>


    </div>
  )
}

export default SignupPage
