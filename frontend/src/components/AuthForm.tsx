import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Button from "@/components/ui/button"
import Terms from "./ui/Terms";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, Eye } from "@hugeicons/core-free-icons";
import { useNavigate } from "react-router";
import Link from "@/components/ui/Link"
import { cn } from "@/utils";

interface AuthFormProps {
  title: string;
  description: string;
  to: string;
  isSignup?: boolean;
  className?: string
  CTA: string;
}

function AuthForm({ title, description, to, CTA, isSignup = false, className }: AuthFormProps) {
  const navigate = useNavigate();

  return (
    <section className={cn("pt-5 flex flex-1 flex-col justify-between", className)}>

      <Button className="self-start gap-2 -ml-8" variant="ghost" onClick={() => navigate(-1)}><HugeiconsIcon icon={ArrowLeft02Icon} /> Back</Button>
      <form className=" flex-2 flex flex-col space-y-14 justify-center">
        <FieldSet className="w-full">
          <FieldLegend>{title}</FieldLegend>
          <FieldDescription>{description}</FieldDescription>
          <FieldGroup>
            {isSignup && <Field>
              <FieldLabel htmlFor="name">Full Name <small className="text-error text-sm">*</small></FieldLabel>
              <Input id="name" type="text" placeholder="e.g Alex Johnson" required />
            </Field>}
            <Field>
              <FieldLabel htmlFor="email">Email Address <small className="text-error text-sm">*</small></FieldLabel>
              <Input id="email" type="email" placeholder="sample@email.com" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password <small className="text-error text-sm">*</small></FieldLabel>
              <Input id="password" type="password" placeholder="Min. 8 characters" required endIcon={Eye} min={8} />
              {!isSignup && <a href="/auth/reset-password" className="text-xs text-neutral-500 text-right ">Forgot Password</a>}

            </Field>

            {isSignup && <Field>
              <FieldLabel htmlFor="confirm_password">Confirm Password <small className="text-error text-sm">*</small></FieldLabel>
              <Input id="confirm_password" type="password" placeholder="Confirm your password" required min={8} />
            </Field>}
          </FieldGroup>
        </FieldSet>

        <Link to={to}>{CTA}</Link>
      </form>

      <Terms isSignup={isSignup} />

    </section>
  )

}

export default AuthForm;
