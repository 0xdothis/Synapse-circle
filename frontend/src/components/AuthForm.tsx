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
import { cn } from "@/utils";
import TermsCondition from "./TermsCondition";
import PrivacyPolicy from "./PrivacyPolicy";
import { type UserDataProps } from "./auth/signup"
import type { ChangeEventHandler, SubmitEventHandler } from "react";

interface AuthFormProps {
  title: string;
  description: string;
  to?: string;
  isSignup?: boolean;
  className?: string
  CTA: string;
  userInfo?: UserDataProps;
  onChange: ChangeEventHandler<HTMLInputElement>
  onSubmit: SubmitEventHandler
}

function AuthForm({ title, description, CTA, userInfo, onChange, onSubmit, isSignup = false, className }: AuthFormProps) {
  const navigate = useNavigate();
  // const location = useLocation()

  if (!userInfo) {
    return;
  }

  return (
    <section className={cn("pt-5 flex flex-1 flex-col justify-between", className)}>

      <Button className="self-start gap-2 -ml-8" variant="ghost" onClick={() => navigate(-1)}><HugeiconsIcon icon={ArrowLeft02Icon} /> Back</Button>
      <form className=" flex-2 flex flex-col space-y-14 justify-center" onSubmit={onSubmit}>
        <FieldSet className="w-full">
          <FieldLegend>{title}</FieldLegend>
          <FieldDescription>{description}</FieldDescription>
          <FieldGroup>
            {isSignup &&
              <>
                <Field>
                  <FieldLabel htmlFor="name">Full Name <small className="text-error text-sm">*</small></FieldLabel>
                  <Input id="name" type="text" placeholder="e.g Alex Johnson" value={userInfo.name} onChange={onChange} required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="phoneNumber">Phone Number <small className="text-error text-sm">*</small></FieldLabel>
                  <Input id="phoneNumber" type="tel" placeholder="Enter a valid number " value={userInfo.phoneNumber} onChange={onChange} required />
                </Field>

              </>
            }
            <Field>
              <FieldLabel htmlFor="email">Email Address <small className="text-error text-sm">*</small></FieldLabel>
              <Input id="email" type="email" placeholder="sample@email.com" value={userInfo.email} onChange={onChange} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password <small className="text-error text-sm">*</small></FieldLabel>
              <Input id="password" type="password" placeholder="Min. 8 characters" value={userInfo.password} onChange={onChange} required endIcon={Eye} min={8} />
              {!isSignup && <a href="/auth/reset-password" className="text-xs text-neutral-500 text-right ">Forgot Password</a>}

            </Field>

            {isSignup &&
              <>
                <Field>
                  <FieldLabel htmlFor="confirm_password">Confirm Password <small className="text-error text-sm">*</small></FieldLabel>
                  <Input id="confirm_password" type="password" placeholder="Confirm your password" value={userInfo.confirm_password} onChange={onChange} required min={8} />
                </Field>
                <Field>
                  <div className="flex gap-4">
                    <Input id="terms" type="checkbox" className="w-fit" required checked={userInfo.terms} onChange={onChange} />
                    <p>I agree to the <TermsCondition text="Terms & Conditions" className="text-primary" /> and <PrivacyPolicy text="Privacy Policy" className="text-primary" /></p>

                  </div>
                </Field>

              </>}
          </FieldGroup>
        </FieldSet>

        <Button type="submit">{CTA}</Button>
      </form>

      <Terms isSignup={isSignup} />

    </section>
  )

}

export default AuthForm;
