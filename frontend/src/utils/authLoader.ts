import { getToken } from "@/lib/authStorage";
import { redirect} from "react-router";


export const protectedLoader = (customLoader?: Function) => {
  return async (args: any) => {
    
    const currentRequestedUrl = new URL(args.request.url);
    const targetPath = currentRequestedUrl.pathname; 

    const rawTokens = getToken();

    if (!rawTokens) {
      return redirect("/auth/login");
    }

    const tokens = JSON.parse(rawTokens);


    if (!!tokens.state.token) {
    
      if (!targetPath.startsWith("/onboarding")) {
          return redirect("/onboarding");
      }
      
      return null; 
    }

    
    if (!!tokens.state.token) {
      
      if (targetPath.startsWith("/onboarding")) {
    
        return redirect("/dashboard");
      }

    
      if (customLoader) {
        return customLoader(args);
      }
      return null;
    }

    
    return redirect("/auth/login");
  };
};

