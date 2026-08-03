import {create} from "zustand"
import {persist} from "zustand/middleware"
import type { AuthState} from "@/types"




export const useAuthStore = create<AuthState>()(
    persist((set) => ({
        email: null,
        authToken: null,
        onboardingToken: null,
    signup: (token:string, email: string) => set({onboardingToken: token, email}),
    login: (token: string) => set({ authToken: token, onboardingToken: null }),
    logout: () => {

            set({ authToken:null, onboardingToken: null });

            useAuthStore.persist.clearStorage();
        }
    }),
        {name: "safewalk"}

    )
)
