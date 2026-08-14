import {
  FieldDescription,
  FieldLegend,
  FieldSet
} from "@/components/ui/field"
import Button from "@/components/ui/button"
import Terms from "./ui/Terms";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { useNavigate } from "react-router";
import { cn } from "@/utils";
import type { SubmitEventHandler } from "react";

interface AuthFormProps {
  title: string;
  description: string;
  isSignup?: boolean;
  CTA: string;
  onSubmit: SubmitEventHandler;
  children: React.ReactNode;
  className?: string;
  isValid?: boolean
}

function AuthForm({ title, description, CTA, onSubmit, isValid, className, isSignup = false, children }: AuthFormProps) {
  const navigate = useNavigate();

  return (
    <section className={cn("pt-5 flex flex-1 flex-col justify-between", className)}>

      <Button className="self-start gap-2 -ml-8" variant="ghost" onClick={() => navigate("/signup")}><HugeiconsIcon icon={ArrowLeft02Icon} /> Back</Button>
      <form className=" flex-2 flex flex-col space-y-14 justify-center" onSubmit={onSubmit}>
        <FieldSet className="w-full">
          <FieldLegend>{title}</FieldLegend>
          <FieldDescription>{description}</FieldDescription>
          {children}
        </FieldSet>

        <Button type="submit" disabled={isValid}>{CTA}</Button>
      </form>

      <Terms isSignup={isSignup} />

    </section>
  )

}

export default AuthForm;
