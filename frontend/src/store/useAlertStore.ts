import {create} from "zustand";
import {persist, createJSONStorage} from "zustand/middleware"

interface AlertState {
    activeAlertId: string | null;
    setActiveAlertId: (id: string) => void;
    clearActiveAlertId: () => void
}

export const useAlertStore = create<AlertState>()(
    persist((set) => ({
        activeAlertId: null,
        setActiveAlertId:(id) => set({activeAlertId: id}),
        clearActiveAlertId: () => set({activeAlertId: null})
    }), {
            name: "active-alert-storage",
            storage: createJSONStorage(() => localStorage)
        })
)
