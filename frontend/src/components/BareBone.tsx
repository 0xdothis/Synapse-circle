import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import React from "react";
import { useNavigate } from "react-router";
import Button from "@/components/ui/button"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/utils";
import { getToken } from "@/lib/authStorage";
import Loader from "@/components/Loader"


interface BareBoneProps {
  icon?: IconSvgElement;
  heading: string;
  description: string;
  children?: React.ReactNode,
  cta?: string;
  resend?: { desc: string; anchor: string; };
  changeEmail?: string;
  to?: string;
  className?: string;
  otp?: string;
  setOTP?: Function;
  email?: string;
}


function BareBone({ icon, heading, description, email, cta, className, otp, setOTP, resend, changeEmail, children }: BareBoneProps) {
  const navigate = useNavigate()
  const [state, setState] = React.useState<"idle" | "loading" | "success">("idle")


  const handleOTP: React.MouseEventHandler<HTMLButtonElement> = async () => {
    setState("loading")
    if (typeof setOTP !== "function") {
      return
    }

    const token = getToken()

    if (!otp?.trim()) {
      alert("OTP is EMPTY");
      setOTP("")

      return;
    }

    const data = await fetch(`https://synap-circle.onrender.com/api/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": `${token}`

      }, body: JSON.stringify({
        email,
        otpCode: otp
      })
    })

    const res = await data.json()


    if (!res.success) {
      alert("Something went wrong")

      setState("idle")

      return;

    }

    setState("idle")

    navigate("/auth/verified")

  }

  if (state === "loading") {
    return <Loader heading="Verfying your OTP" description="This will only take a while" />
  }

  return (
    <>

      <Button className="self-start gap-2 lg:-ml-4" variant="ghost" onClick={() => navigate(-1)}> <HugeiconsIcon icon={ArrowLeft02Icon} /> Back</Button>

      <div className={cn("flex-1 flex flex-col justify-around", className)}>
        <div className="space-y-8 flex flex-col items-center text-center">
          {icon && <div className="bg-brand-50 rounded-full w-30 h-30 text-primary flex justify-center items-center">
            <HugeiconsIcon icon={icon} size={60} />
          </div>}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-neutral-900">{heading}</h3>
            <p className="text-base text-neutral-700">{description}</p>
          </div>

          <div className="flex flex-col w-full items-center">
            {children}
          </div>
        </div>
        {cta && <BareBoneFooter cta={cta} email={email} handleOTP={handleOTP} resend={resend} changeEmail={changeEmail} />}
      </div>
    </>
  )
}

function BareBoneFooter({ cta, resend, email, changeEmail, handleOTP, className }: { cta?: string; resend?: { desc: string; anchor: string; }; changeEmail?: string; email?: string; handleOTP: React.MouseEventHandler<HTMLButtonElement>; className?: string; }) {

  const [state, setState] = React.useState<"idle" | "loading" | "success">("idle")


  const navigate = useNavigate();

  const handleResendOTP = async () => {
    setState("loading");

    const token = getToken();


    const data = await fetch(`https://synap-circle.onrender.com/api/auth/resend-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": `${token}`

      }, body: JSON.stringify({ email })
    })

    const res = await data.json()

    console.log(res)

    if (!res.success) {
      alert("Something went wrong")

      setState("idle")

      return;

    }

    setState("idle")

    alert("Token Resent successfully")

  }


  if (state === "loading") {
    return <Loader heading="Resending your new OTP Token" description="Hang in tight you OTP token will arrive shortly" />
  }

  return (
    <div className={cn("flex flex-col text-center space-y-1 mt-6", className)}>
      <Button onClick={handleOTP} > {cta} </Button>
      {resend && <span className="gap-2 block pt-4">{resend.desc} <a className="underline text-primary" onClick={handleResendOTP}>{resend.anchor}</a></span>}
      {changeEmail && <Button variant="ghost" size="md" onClick={() => navigate(-1)}>{changeEmail}</Button>}
    </div>

  )
}

export default BareBone
