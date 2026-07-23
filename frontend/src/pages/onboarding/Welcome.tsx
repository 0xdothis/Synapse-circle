import Template from "../../components/onboarding/Template"
import logo from "../../assets/safewalk_opacity.png"
import Button from "@/components/ui/button"
import { useNavigate } from "react-router"

function Welcome() {
  const navigate = useNavigate()
  return (
    <Template heading="Let's Get You Protected" description="A few quick steps to set up your emergency alerts. It takes about two minutes." image={logo}>
      <Button className="lg:mt-6" onClick={() => navigate("location")}>Continue</Button>
    </Template>
  )
}

export default Welcome
