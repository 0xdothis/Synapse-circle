import {create} from "zustand"
import {persist} from "zustand/middleware"
import type { AuthState} from "@/types"


export const useAuthStore = create<AuthState>()(
    persist((set) => ({
        email: null,
        token: null,
    signup: (token:string, email: string) => set({ token, email }),
    login: (token: string) => set({ token }),
    logout: () => {

            set({ token:null});

            useAuthStore.persist.clearStorage();
        }
    }),
        {name: "safewalk", partialize: (state) => ({token: state.token, email: state.email})}

    )
)
