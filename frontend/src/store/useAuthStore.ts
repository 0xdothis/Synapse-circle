import {create} from "zustand"
import {createJSONStorage, persist} from "zustand/middleware"
import type { AuthState} from "@/types"


export const useAuthStore = create<AuthState>()(
    persist((set) => ({
        email: null,
        token: null,
        isVerified: null,
    signup: (token:string, email: string, isVerified: boolean) => set({ token, email, isVerified }),
    login: (token: string) => set({ token }),
    logout: () => {

            set({ token:null});

            useAuthStore.persist.clearStorage();
        }
    }),
        {name: "safewalk",   storage: createJSONStorage(() => localStorage)}

    )
)
