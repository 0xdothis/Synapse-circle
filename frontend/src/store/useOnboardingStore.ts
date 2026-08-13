import type { ContactDTO } from "@/types";
import {create} from "zustand"
import { persist, createJSONStorage } from "zustand/middleware";

interface LocationProps {
    latitude: number;
    longitude: number
}

interface OnboardingState {
    onboardingData: {
        location: LocationProps
        name: string;
        acronym: string;
        contacts: ContactDTO[]
    },
    updateLocation: (location: LocationProps) => void
    updateFields: (fields: Partial<OnboardingState['onboardingData']>) => void,
    handleContactChange: (index: number, updatedContact: ContactDTO) => void,
    handleUniversityChange: (school: {name: string, acronym: string}) => void,
    addContactSlot: () => void,
    removeContactSlot: (indexToRemove: number) => void,
    clearOnboardingData: () => void;

}
const initialState = {
    location: {
    latitude: 0,
    longitude: 0
    },
    name: "",
    acronym: "",
    contacts: [{name: "", email: "", phoneNumber: "", relationship: ""}]
    }


export const useOnboardingStore = create<OnboardingState>()(
persist(
        (set) => ({
    onboardingData: initialState,
    updateFields: (fields) => set((state) => ({
        onboardingData: {...state.onboardingData, ...fields}
    })),
    
    handleContactChange: (index, updatedContact) => set((state) => {
        const newContacts = [...state.onboardingData.contacts];
        newContacts[index] = updatedContact;
        return {
            onboardingData: {...state.onboardingData, contacts: newContacts}
        }
    }),
    handleUniversityChange:(school) => set((state) => ({
                onboardingData: { ...state.onboardingData,
                    acronym: school.acronym,
                    name: school.name
                }    

            })),
    updateLocation:(location) => set((state) => ({

        onboardingData: {
            ...state.onboardingData,
            location
        }
        
    }))
    ,

    addContactSlot: () => set((state) => ({
        onboardingData: {
            ...state.onboardingData,
            contacts: [...state.onboardingData.contacts, {name: "", email: "", phoneNumber: "", relationship: ""}]
        }
    })),
    removeContactSlot: (indexToRemove) => set((state) => {
        const currentContacts = state.onboardingData.contacts;
        if(currentContacts.length > 1) {
            return {
                onboardingData: {
                    ...state.onboardingData,
                    contacts: currentContacts.filter((_, index) => index !== indexToRemove)
                }
            }
        }
        return {}
    }),
     clearOnboardingData: () =>
        set(() => ({
          onboardingData: initialState,
        })), // ← this comma just separates it from the next action, nothing else follows it inside this object
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => localStorage),
    }
   ))
