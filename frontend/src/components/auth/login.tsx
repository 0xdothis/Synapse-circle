import React from "react"
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
import { useMutation } from "@tanstack/react-query";
import { login } from "@/utils/safewalkFn";
import Loader from "@/components/Loader";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";


export interface LoginCredentials {
  email: string;
  password: string;
}

function Signin() {

  const [user, setUser] = React.useState<LoginCredentials>({ email: "", password: "" })
  const navigate = useNavigate();
  const authLogin = useAuthStore(state => state.login)


  const isValid = !user.email.trim() || !user.password.trim();

  const { isPending, mutate, error } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {

      if (!data.success) {
        toast.error(data.message)
        return;
      }

      const authToken = data.accessToken;
      const isVerified = data.user?.isVerified

      if (authToken && isVerified) {
        authLogin(authToken, isVerified)
      }


      trackEvent("login_completed")
      navigate("/dashboard")

    },
    onError: (err) => {
      console.log("[ERROR]", err)
    }

  })

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { id, value, } = e.target;

    setUser((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    trackEvent("login_started")

    console.log("HANDLE LOGIN", error?.message)

    mutate(user)

  }

  if (isPending) {
    return <Loader heading="Welcome Back" description="Redirection to SafeWalk Campus" />
  }



  return <AuthForm title="Welcome Back" description="Log in to continue." CTA="Log in" onSubmit={handleSubmit} isValid={isValid}>
    <FieldGroup className="mt-8">
      <Field>
        <FieldLabel htmlFor="email">Email Address <small className="text-error text-sm">*</small></FieldLabel>
        <Input id="email" type="email" placeholder="sample@email.com" value={user.email} onChange={handleChange} required />
      </Field>
      <Field>
        <FieldLabel htmlFor="password">Password <small className="text-error text-sm">*</small></FieldLabel>
        <Input id="password" type="password" placeholder="Min. 8 characters" value={user.password} onChange={handleChange} required endIcon={Eye} min={8} />
      </Field>

    </FieldGroup>

    <a href="/auth/reset-password" className="text-xs self-end w-fit  text-right text-neutral-500">Forgot Password</a>
  </AuthForm>
}

export default Signin

