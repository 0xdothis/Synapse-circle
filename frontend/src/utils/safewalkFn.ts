
import type { LoginCredentials } from "@/components/auth/login";
import { getToken } from "@/lib/authStorage";
import {loginAuthResponseSchema, signupAuthResponseSchema, type ContactDTO, type LoginResponse, type signupDTO, type SignupResponse } from "@/types";



export const signupUser = async (data: signupDTO): Promise<SignupResponse> => {
     const {name, email, password, phoneNumber} = data;

    const res = await fetch("https://synap-circle.onrender.com/api/auth/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",

        },
        body: JSON.stringify({name, email, phoneNumber, password})
    })

    

    const rawJson = await res.json()

    const result = signupAuthResponseSchema.parse(rawJson);
    console.log(result)

    if(!result.success) {
        throw new Error(rawJson.message || "Invalid server response");
    }

    return result
 
}

export const verifyOTP = async ({otp, email}:{otp: string; email: string;}): Promise<LoginResponse> => {

    const rawToken = getToken();

    if(!rawToken) {
        throw new Error("Something went wrong");
    }

    const token = JSON.parse(rawToken)

    const res = await fetch(`https://synap-circle.onrender.com/api/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": `${token.state.onboardingToken}`

      }, body: JSON.stringify({
        email,
        otpCode: otp
      })
    })

    const rawJson = await res.json();

    const result = loginAuthResponseSchema.parse(rawJson)

    if(!result.success) {
        throw new Error(rawJson.message || "Invalid OTP token")
    }

    return result

}

export const resendOTP = async() => {

}

export const login = async (user: LoginCredentials): Promise<LoginResponse> => {

    const {email, password} = user;

    if(!email.trim() || !password.trim()) {
        throw new Error("email or password cannot be empty")
    }

    const res = await fetch("https://synap-circle.onrender.com/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({email, password})
    })

    const rawJson = await res.json();
    

    const result = loginAuthResponseSchema.parse(rawJson)
    console.log(result)

    if(!result.success) {
        throw new Error(rawJson.message || "Something went wrong try again")
    }

    return result


}

export const onboardingRegistration = async(onboardingInfo: {
    step?: string;
        data: {
        location?: {latitude: number; longitude: number}
        universityId?: string
        selectedUniversity?: string
        contact?: ContactDTO[]
    }}
 ) => {

     const rawToken = getToken();

    if(!rawToken) {
        throw new Error("Something went wrong");
    }

    const token = JSON.parse(rawToken)

    console.log("[OnboardingInfo]", onboardingInfo)


        const reqData = {
        step: onboardingInfo.step,
        data: onboardingInfo.data
    }

    console.log(reqData)
    
    const res = await fetch("https://synap-circle.onrender.com/api/auth/onboarding-step", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "x-csrf-token": `${token.state.onboardingToken}`
        },
        body: JSON.stringify(reqData)
    })

    const rawJson = await res.json();

    console.log(rawJson)

    return rawJson

}


export const loginWithGoogle = async (credential: string) => {
    
    const res = await fetch("https://synap-circle.onrender.com/api/auth/google", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({idToken: credential})
    })

    const rawJson = await res.json();

    console.log(rawJson)

    return rawJson

}

export const triggerSOS = async (sosData: {latitude: number, longitude: number, locationAvailable: boolean}) => {

    
     const rawToken = getToken();

    if(!rawToken) {
        throw new Error("Something went wrong");
    }

    const token = JSON.parse(rawToken)



  const res = await fetch("https://synap-circle.onrender.com/api/sos/trigger", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
             "x-csrf-token": `${token.state.authToken}`

        },
        body: JSON.stringify(sosData)
    })


    const rawJson = await res.json();

    console.log(rawJson)

    return rawJson

}

export const logout = async() => {}
