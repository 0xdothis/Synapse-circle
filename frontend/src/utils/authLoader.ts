import { getToken } from "@/lib/authStorage";
import { redirect, type LoaderFunction, type LoaderFunctionArgs} from "react-router";


export const protectedLoader = (customLoader?: LoaderFunction) => {
  return async (args: LoaderFunctionArgs) => {

    const localToken = getToken();

    if (!localToken?.token) {
      return redirect("/auth/login")
  }

    if(localToken?.isVerified) {
      return null
    }



    if (customLoader) {
      return customLoader(args)
    }

    return redirect("/auth/verify-email")
  }
}


export const publicOnlyLoader = (customLoader?: LoaderFunction) => {
  return async (args: LoaderFunctionArgs) => {
    const localToken = getToken()

    if(!localToken?.isVerified) {
        return null
    }

    if (localToken?.token ) {
      return redirect("/dashboard")
    }

    if (customLoader) {
      return customLoader(args)
    }

    return null
  }
}


export const verifiedOnlyLoader = () => {
  return async () => {

    const localToken = getToken();

    if (localToken?.isVerified && localToken?.isVerified) {
      return redirect("/dashboard")
    }

      return null
  }
}

