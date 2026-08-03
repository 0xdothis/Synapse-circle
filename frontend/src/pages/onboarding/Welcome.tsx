import Template from "../../components/onboarding/Template"
import logo from "../../assets/safewalk_opacity.png"
import Button from "@/components/ui/button"
import { useNavigate } from "react-router"
import { trackEvent } from "@/lib/mixpanelClient"

function Welcome() {
  const navigate = useNavigate()

  function handleOnboarding() {
    trackEvent("onboarding_started")

    navigate("location")

  }
  return (
    <Template heading="Let's Get You Protected" description="A few quick steps to set up your emergency alerts. It takes about two minutes." image={logo}>
      <Button className="lg:mt-6" onClick={handleOnboarding}>Continue</Button>
    </Template>
  )
}

export default Welcome
