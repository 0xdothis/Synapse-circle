import Button from "@/components/ui/button";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import mobile_sos from "../assets/home/mobile-sos.svg";
import doodlesMobile from "../assets/home/doodles-mobile.svg"
import { useNavigate } from "react-router";


function Banner() {
  const navigate = useNavigate()


  return (
    <div style={{
      backgroundImage: `url(${doodlesMobile})`
    }} className="bg-primary text-neutral-50 px-6 pt-8 rounded-3xl w-full space-y-3 my-14 bg-cover bg-center bg-no-repeat flex flex-col">
      <h2 className="text-2xl font-semibold">Walk with confidence. SafeWalk Campus has your back.</h2>
      <p className="text-sm text-brand-100 pb-1">Set up in under two minutes. Free for every student.</p>
      <Button className="bg-brand-50 text-primary gap-2 w-full" onClick={() => navigate("/signup")}>Create your account <HugeiconsIcon icon={ArrowRight01Icon} size={24} /></Button>
      <div className="self-center">
        <img src={mobile_sos} />
      </div>

    </div>
  )
}

export default Banner;
