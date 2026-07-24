import React from "react"
import AuthForm from "../AuthForm";
import { trackEvent } from "@/lib/mixpanelClient";
import type { UserDataProps } from "./signup";

export interface LoginCredentials {
  email: string;
  password: string;
}

function Signin() {
  const URL = import.meta.env.VITE_BACKEND_URL;

  const [user, setUser] = React.useState<LoginCredentials>({ email: "", password: "" })

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { id, value, } = e.target;

    setUser((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    trackEvent("login_submitted")

    const userData: LoginCredentials = user;

    console.log(userData)

    const res = await fetch(`${URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userData)
    })

    console.log(res)



    const data = await res.json();

    trackEvent("login_completed")
    console.log(data)




  }



  return <AuthForm title="Welcome Back" description="Log in to continue." CTA="Log in" onChange={handleChange} onSubmit={handleSubmit} userInfo={user as UserDataProps} />
}

export default Signin

