import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import React from "react";
import { useNavigate } from "react-router";
import Link from "@/components/ui/Link"
import Button from "@/components/ui/button"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/utils";


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
}

function BareBone({ icon, heading, description, cta, className, to, resend, changeEmail, children }: BareBoneProps) {
  const navigate = useNavigate()

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
        {cta && <BareBoneFooter cta={cta} to={to} resend={resend} changeEmail={changeEmail} />}
      </div>
    </>
  )
}

function BareBoneFooter({ cta, resend, changeEmail, to, className }: { cta?: string; resend?: { desc: string; anchor: string; }; changeEmail?: string; to?: string; className?: string; }) {

  const navigate = useNavigate();
  return (
    <div className={cn("flex flex-col text-center space-y-1 mt-6", className)}>
      <Link to={to!} > {cta} </Link>
      {resend && <span className="gap-2 block pt-4">{resend.desc} <a className="underline text-primary" onClick={() => alert("code sent successfully")}>{resend.anchor}</a></span>}
      {changeEmail && <Button variant="ghost" size="md" onClick={() => navigate(-1)}>{changeEmail}</Button>}
    </div>

  )
}

export default BareBone
