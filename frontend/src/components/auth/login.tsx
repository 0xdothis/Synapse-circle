import React from "react"
import AuthForm from "../AuthForm";
import { identifyUser, trackEvent } from "@/lib/mixpanelClient";
import type { UserDataProps } from "./signup";
import { useNavigate } from "react-router";

export interface LoginCredentials {
  email: string;
  password: string;
}

function Signin() {

  const [user, setUser] = React.useState<LoginCredentials>({ email: "", password: "" })
  const [state, setState] = React.useState<"idle" | "loading" | "success">("idle")
  const navigate = useNavigate()

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { id, value, } = e.target;

    setUser((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    setState("loading")

    trackEvent("login_submitted")

    const userData: LoginCredentials = user;

    const tokenReq = await fetch(`https://synap-circle.onrender.com/api/auth/csrf-token`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })

    const token = await tokenReq.json();


    const res = await fetch(`https://synap-circle.onrender.com/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": `${token?.csrfToken}`
      },
      body: JSON.stringify(userData)
    })



    const data = await res.json();

    if (!data.success) {
      alert("Something went wrong");
      setState("idle")
      return;
    }

    setUser({ email: "", password: "" })

    identifyUser(data?.email)

    trackEvent("login_completed");

    setState("idle")
    navigate("/dasboard")

  }



  return <AuthForm title="Welcome Back" description="Log in to continue." CTA="Log in" onChange={handleChange} onSubmit={handleSubmit} userInfo={user as UserDataProps} state={state} />
}

export default Signin

