import React from "react";
import AuthForm from "../AuthForm";
import { trackEvent } from "@/lib/mixpanelClient";
import { useNavigate } from "react-router";
import { setToken } from "@/lib/authStorage";


export interface UserDataProps {
  name: string;
  password: string;
  email: string;
  confirm_password: string;
  terms: boolean;
  phoneNumber: string;
}

const URL = import.meta.env.VITE_BACKEND_URL;


function Signup() {

  const [userInfo, setUserInfo] = React.useState<UserDataProps>({ name: "", password: "", email: "", confirm_password: "", phoneNumber: "", terms: false })

  const navigate = useNavigate();

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { id, value, checked, type } = e.target;

    const newValue = type === "checkbox" ? checked : value

    setUserInfo((prev) => ({ ...prev, [id]: newValue }))
  }

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    trackEvent("signup_submitted")


    const { confirm_password, terms, ...cleanInfo } = userInfo

    const userData: Omit<UserDataProps, "confirm_password" | "terms"> = cleanInfo


    const res = await fetch(`${URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userData)
    })

    const tokenReq = await fetch(`${URL}/auth/csrf-token`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })



    const data = await res.json();
    const token = await tokenReq.json();

    console.log(data)

    if (data.success) {

      setToken(token?.csrfToken)
      trackEvent("signup_completed");

      navigate("/auth/verify-email", {
        state: {
          email: userData.email
        }
      })

    }




  }

  return <AuthForm title="Create Account" description="Create your SafeWalk Campus account to get started." isSignup={true} to="/auth/verification" CTA="Create Account" onChange={handleChange} userInfo={userInfo} onSubmit={handleSubmit} />
}

export default Signup
