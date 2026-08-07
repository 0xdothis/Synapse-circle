import type { ContactDTO } from "@/types";
import {create} from "zustand"
import {produce} from "immer"


interface LocationProps {
    latitude: number;
    longitude: number
}

export interface OnboardingState {
    onboardingData: {
        location: LocationProps
        universityId: string;
        selectedUniversity: string;
        contacts: ContactDTO[]
    },
    updateLocation: (location: LocationProps) => void
    updateFields: (fields: Partial<OnboardingState['onboardingData']>) => void,
    handleContactChange: (index: number, updatedContact: ContactDTO) => void,
    addContactSlot: () => void,
    removeContactSlot: (indexToRemove: number) => void

}
const initialState = {
    location: {
    latitude: 0,
    longitude: 0
    },
    universityId: "",
    selectedUniversity: "",
    contacts: [{name: "", email: "", phoneNumber: "", relationship: null}]
    }


export const useOnboardingStore = create<OnboardingState>((set) => ({
    onboardingData: initialState,
    updateFields: (fields) => set(produce((state) => {
        state.onboardingData = {...fields}
    })),

    handleContactChange: (index, updatedContact) => set(produce((state) => {

        const newContacts = [...state.onboardingData.contacts];
        newContacts[index] = updatedContact;
        return {
            onboardingData: {...state.onboardingData, contacts: newContacts}
        }
    })),

    updateLocation:(location) => set(produce((state) => {
        state.onboardingData.location = location
    })),

    addContactSlot: () => set(produce((state) => ({
        onboardingData: {
            ...state.onboardingData,
            contacts: [...state.onboardingData.contacts, {name: "", email: "", phoneNumber: "", relationship: ""}]
        }
    }))),

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
    })
}))
