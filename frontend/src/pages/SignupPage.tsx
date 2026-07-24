import Button from "@/components/ui/button"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
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
        <picture>
          <source type="image/avif" srcSet="
            /signup/lady_mobile.avif 1x, /signup/lady_mobile@2x.avif 2x, /signup/lady_mobile@3x.avif 3x
            " />


          <source type="image/png" srcSet="
            /signup/lady_mobile.png 1x, /signup/lady_mobile@2x.png 2x, /signup/lady_mobile@3x.png 3x
            " />
          <img src="/signup/lady_mobile.png" alt="a lady in school holding a mobile device" className="w-full h-full" />
        </picture>

      </div>

      <div className="w-full flex flex-col items-center text-center space-y-4">
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-neutral-900">Create your account</h3>
          <p className="text-neutral-700">Stay connected with trusted contacts and campus security.</p>
        </div>
        <div className="flex flex-col w-full space-y-4">
          <Link to="google" variant="outline" size="sm">Continue with Google</Link>
          <small className="text-center text-xs text-neutral-400">OR</small>
          <Link to="/auth/login" variant="secondary" size="sm">Continue with Email</Link>
        </div>
        <Terms />
      </div>


    </div>
  )
}

export default SignupPage
