import { ForgotPasswordIcon, Mail01Icon, MailCheck } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import BareBone from "../BareBone"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp"
import { Input } from "@/components/ui/input"
import Button from "@/components/ui/button"


import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet
} from "@/components/ui/field"
import { useNavigate } from "react-router"
import React from "react"
import Link from "@/components/ui/Link"
import { useMutation } from "@tanstack/react-query"
import { verifyOTP } from "@/utils/safewalkFn"
import { useAuthStore } from "@/store/useAuthStore"

function SignUpVerification() {

  const email = useAuthStore(state => state.email)
  const navigate = useNavigate()
  const [otp, setOTP] = React.useState("")

  const isValid = otp.trim().length !== 6;

  const { isPending, mutate, error } = useMutation({
    mutationFn: verifyOTP,
    onSuccess: (data) => {

      if (!data.success) {
        console.log(data.message || "OTP verfication failed");
        return;
      }




      setOTP("");
      navigate("/auth/verified", { replace: true })



    },
    onError: (err) => {
      throw err
    }

  })

  let maskedEmail: string = "";

  if (email) {
    const [name, domain] = email.split('@');
    const maskedName = name[0] + name[1] + '*'.repeat(name.length - 2);
    maskedEmail = `${maskedName}@${domain}`

  }

  const handleOTP: React.MouseEventHandler<HTMLButtonElement> = async () => {

    if (!email) {
      throw new Error("OTP verification failed")
    }

    mutate({ otp, email });


  }

  const handleResendOTP = async () => {

    const data = await fetch(`https://synap-circle.onrender.com/api/auth/resend-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": `$`

      }, body: JSON.stringify({ email })
    })

    const res = await data.json()

    console.log(res)


  }

  if (error) {
    throw error
  }


  return (
    <section className="pt-5 flex-1 flex flex-col items-center">
      <BareBone heading="Verify your email" description={`Enter the 6-digit code we sent to ${maskedEmail}`} icon={Mail01Icon}>
        <InputOTP maxLength={6} value={otp} onChange={(otp) => setOTP(otp)}>
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
      <div className="h-20" />
      <div className="text-center w-full flex flex-col justify-center" >
        <Button className="w-full" onClick={handleOTP} disabled={isPending || isValid}>Continue </Button>
        <p className="flex justify-center items-center h-14 gap-2 mt-3">Didn't get a code? <a onClick={handleResendOTP} className="text-primary">Resend?</a></p>
        <Button className="w-full" variant="ghost">Change Email Address</Button>
      </div>
    </section >

  )
}


function SignUpVerified() {

  return (
    <section className="pt-5 flex flex-col flex-1 lg:pb-5">
      <BareBone heading="Email verified!" description="Your email has been verified. Let's set up your safety profile." icon={MailCheck}  >


        <div className="h-50 lg:hidden" />
        <Link className="w-full" to="/onboarding">Continue to setup</Link>

      </BareBone>
    </section>

  )
}

function ChangeEmail() {

  return (
    <section className="pt-5 flex flex-col flex-1 lg:pb-5">
      <BareBone heading="Change Email" description="Update your login email address and notification preferences." icon={Mail01Icon}>

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
          <p className="text-left text-neutral-700 text-xs">A security verification code will be sent to your old email address to confirm ownership before the change is finalized.</p>
        </div>
        <Button className="w-full mt-4">Update Email</Button>

      </BareBone>

    </section>

  )
}

function ForgotPassword() {

  return (
    <section className="pt-5 flex flex-col flex-1 lg:pb-5">

      <BareBone heading="Forgot Password?" description="Enter the email address associated with your account and we'll send you a password reset code." icon={ForgotPasswordIcon}>

        <div className="lg:hidden h-20" />

        <form className="space-y-8 w-full">
          <FieldSet className="w-full max-w-full">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input id="email" type="email" placeholder="john.doe@email.com" required />
              </Field>
            </FieldGroup>
          </FieldSet>

          <Button className="w-full"> Send Reset Link </Button>
        </form>
      </BareBone>

    </section>
  )

}

function CheckYourEmail() {
  const navigate = useNavigate();

  return (
    <section className="pt-5 flex flex-col flex-1 relative items-center lg:pb-5">
      <BareBone heading="Check Your Email" description="You'll receive password reset instructions if an account is associated with this email address." icon={Mail01Icon}>

        <div className="lg:hidden h-20" />
        <Button className="w-full" onClick={() => navigate("/auth/login")} >Back to Login</Button>
        <a onClick={() => navigate(-1)} className="self-center p-4 text-sm block text-brand-500">Resend Email</a>

      </BareBone>
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
