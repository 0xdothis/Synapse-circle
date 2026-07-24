import { ForgotPasswordIcon, Mail01Icon, MailCheck } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import BareBone from "../BareBone"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet
} from "@/components/ui/field"
import { useNavigate } from "react-router"


function SignUpVerification() {

  return (
    <section className="pt-5 flex-1 flex flex-col">
      <BareBone heading="Verify your email" description="Enter the 6-digit code we sent to t***@gmail.com" icon={Mail01Icon} cta="Continue" resend={{ desc: "Didn't get a code? ", anchor: "Resend" }} changeEmail="Change Email Address" to="/auth/verified">
        <InputOTP maxLength={6} >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>

      </BareBone>
    </section>

  )
}


function SignUpVerified() {

  return (
    <section className="pt-5 flex flex-col flex-1 lg:pb-5">
      <BareBone heading="Email verified!" description="Your email has been verified. Let's set up your safety profile." icon={MailCheck} cta="Continue to setup" to="/onboarding"  >
      </BareBone>

    </section>

  )
}

function ChangeEmail() {

  return (
    <section className="pt-5 flex flex-col flex-1 lg:pb-5">
      <BareBone heading="Change Email" description="Update your login email address and notification preferences." icon={Mail01Icon} cta="Update Email" >

        <form className=" flex flex-col space-y-14 w-full items-center">
          <FieldSet className="w-full max-w-full">
            <FieldGroup className="">
              <Field>
                <FieldLabel htmlFor="email">Current Email Address</FieldLabel>
                <Input id="email" type="email" placeholder="john.doe@email.com" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="new_email">New Email Address <small className="text-error text-sm">*</small></FieldLabel>
                <Input id="new_email" type="email" placeholder="john.doe@email.com" required />
              </Field>
            </FieldGroup>
          </FieldSet>
        </form>
        <div className="bg-brand-50 border border-brand-300 p-4 rounded-xl flex flex-row items-center gap-3 mt-6">
          <div className="bg-primary w-9 h-9 p-2.5 text-white flex justify-center items-center rounded-full">
            <HugeiconsIcon icon={Mail01Icon} size={18} />
          </div>
          <p className="text-left text-neutral-700 text-xs">A security verification code will be sent to your new email address to confirm ownership before the change is finalized.</p>
        </div>

      </BareBone>

    </section>

  )
}

function ForgotPassword() {
  return (
    <section className="pt-5 flex flex-col flex-1 relative lg:pb-5">
      <BareBone heading="Forgot Password?" description="Enter the email address associated with your account and we'll send you a password reset code." icon={ForgotPasswordIcon} cta="Send Reset Link" to="/auth/reset-check">

        <form className="flex flex-col space-y-14 w-full absolute bottom-1/4">
          <FieldSet className="w-full max-w-full">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input id="email" type="email" placeholder="john.doe@email.com" required />
              </Field>
            </FieldGroup>
          </FieldSet>
        </form>
      </BareBone>

    </section>
  )

}

function CheckYourEmail() {
  const navigate = useNavigate();

  return (
    <section className="pt-5 flex flex-col flex-1 relative items-center lg:pb-5">
      <BareBone heading="Check Your Email" description="You'll receive password reset instructions if an account is associated with this email address." icon={Mail01Icon} cta="Back to Login" to="/auth/login">
      </BareBone>
      <div className="absolute bottom-1/12 text-sm text-brand-500 font-semibold">
        <a onClick={() => navigate(-1)} className="self-center p-4">Resend Email</a>
      </div>
    </section>


  )
}

export {
  SignUpVerification,
  SignUpVerified,
  ChangeEmail,
  ForgotPassword,
  CheckYourEmail
}
