import React from "react";
import AuthForm from "../AuthForm";
import { trackEvent } from "@/lib/mixpanelClient";
import { useNavigate } from "react-router";
import {
  Field,
  FieldGroup,
  FieldLabel,

} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Eye } from "@hugeicons/core-free-icons"
import PrivacyPolicy from "../PrivacyPolicy";
import TermsCondition from "../TermsCondition";
import { useMutation } from "@tanstack/react-query";
import { signupUser } from "@/utils/safewalkFn";
import type { signupDTO } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import Loader from "@/components/Loader"


export interface UserDataProps {
  name: string;
  password: string;
  email: string;
  confirm_password: string;
  terms: boolean;
  phoneNumber: string;
}


function Signup() {

  const [userInfo, setUserInfo] = React.useState<signupDTO>({ name: "", password: "", email: "", confirmPassword: "", phoneNumber: "", terms: false })
  const signup = useAuthStore(state => state.signup)
  const navigate = useNavigate();

  const isValid = !userInfo.name.trim() || !userInfo.password.trim() || !userInfo.email.trim() || !userInfo.confirmPassword.trim() || !userInfo.phoneNumber.trim() || !userInfo.terms

  const { isPending, mutate, error } = useMutation({
    mutationFn: signupUser,
    onSuccess: (data) => {

      if (!data.success) {
        console.log(data.message || "signup failed");
        return;
      }

      console.log(data)

      const token = data.accessToken;

      if (token) {
        signup(token, userInfo.email)
      }

      setUserInfo({ name: "", password: "", email: "", confirmPassword: "", phoneNumber: "", terms: false })

      trackEvent("signup_completed")

      navigate("/auth/verify-email", { replace: true })

    },
    onError: (error) => {
      console.log(error)

    }
  })

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const { id, value, checked, type } = e.target;

    const newValue = type === "checkbox" ? checked : value

    setUserInfo((prev) => ({ ...prev, [id]: newValue }))
  }

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    trackEvent("signup_submitted");

    mutate(userInfo)
  }


  if (isPending) {
    return <Loader heading="Create your account..." description="Setting up your safety environment" />
  }

  if (error) {
    console.log(error)
  }

  return (<AuthForm title="Create Account" description="Create your SafeWalk Campus account to get started." isSignup={true} CTA="Create Account" onSubmit={handleSubmit} isValid={isValid}>
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="name">Full Name <small className="text-error text-sm">*</small></FieldLabel>
        <Input id="name" type="text" placeholder="e.g Alex Johnson" value={userInfo.name} onChange={handleChange} required />
      </Field>
      <Field>
        <FieldLabel htmlFor="phoneNumber">Phone Number <small className="text-error text-sm">*</small></FieldLabel>
        <Input id="phoneNumber" type="tel" placeholder="Enter a valid number " value={userInfo.phoneNumber} onChange={handleChange} required />
      </Field>

      <Field>
        <FieldLabel htmlFor="email">Email Address <small className="text-error text-sm">*</small></FieldLabel>
        <Input id="email" type="email" placeholder="sample@email.com" value={userInfo.email} onChange={handleChange} required />
      </Field>
      <Field>
        <FieldLabel htmlFor="password">Password <small className="text-error text-sm">*</small></FieldLabel>
        <Input id="password" type="password" placeholder="Min. 8 characters" value={userInfo.password} onChange={handleChange} required endIcon={Eye} min={8} />
      </Field>
      <Field>
        <FieldLabel htmlFor="confirmPassword">Confirm Password <small className="text-error text-sm">*</small></FieldLabel>
        <Input id="confirmPassword" type="password" placeholder="Confirm your password" value={userInfo.confirmPassword} onChange={handleChange} required min={8} />
      </Field>
      <Field>
        <div className="flex gap-4">
          <Input id="terms" type="checkbox" className="w-fit" required checked={userInfo.terms} onChange={handleChange} />
          <p>I agree to the <TermsCondition text="Terms & Conditions" className="text-primary" /> and <PrivacyPolicy text="Privacy Policy" className="text-primary" /></p>
        </div>
      </Field>

    </FieldGroup>

  </AuthForm >
  )
}

export default Signup
