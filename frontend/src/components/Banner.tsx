import Button from "@/components/ui/button";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { useNavigate } from "react-router";



function Banner() {

  const navigate = useNavigate()


  return (
    <div className="bg-primary bg-[url('/doodles-outline-20.png')] lg:bg-[url('/doodles-outline-desk.png')] text-neutral-50 px-6 pt-8 rounded-3xl w-full space-y-3 my-14 bg-cover bg-center bg-no-repeat flex flex-col lg:flex-row lg:justify-between">
      <div className="lg:space-y-4">
        <h2 className="text-2xl lg:text-[2.5rem] font-semibold">Walk with confidence. <br /> SafeWalk Campus has your back.</h2>
        <p className="text-sm lg:text-[1.125rem] text-brand-100 pb-1">Set up in under two minutes. Free for every student.</p>
        <Button className="bg-brand-50 text-primary gap-2 w-full lg:w-75" onClick={() => navigate("/signup")}>Create your account <HugeiconsIcon icon={ArrowRight01Icon} size={24} /></Button>
      </div>
      <div className="self-center">
        <picture>
          <source type="image/png" srcSet="
            /home/mobile_sos.png 1x, /home/mobile_sos@2x.png 2x, /home/mobile_sos@3x.png 3x
            " />
          <img src="/home/mobile_sos.png" alt="doodles on a background" />
        </picture>
      </div>

    </div>
  )
}

export default Banner;
