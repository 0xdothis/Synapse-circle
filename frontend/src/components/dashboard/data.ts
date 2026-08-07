export const hospitalFilter = [
    {label: "Nearest"},
    {label: "Open Now"},
    {label: "Teaching"},
    {label: "General"}
]

export type HospitalProps = {
        tag?: string;
        type: string;
        operatingHour: string;
        name: string;
        distance: {
            km: string;
            drive: string;
        },
        address: string;
        tel: string;

}


export const hospitals: HospitalProps[] = [
    {
        tag: "nearest",
        type: "Teaching Hospital",
        operatingHour: "Opens 24hrs",
        name: "University of Ilorin Teaching Hospital",
        distance: {
            km: "0.8 km",
            drive: "3 min drive"
        },
        address: "Oke-Ose, PMB 1515, Ilorin, Nigeria",
        tel: "+234 803 123 4567"
    },
 { 
        type: "General Hospital",
        operatingHour: "Opens 24hrs",
        name: "General Hospital Ilorin",
        distance: {
            km: "2.4 km",
            drive: "8 min drive"
        },
        address: "Adewole Area, Ilorin, Nigeria",
        tel: "+234 802 987 6543"
    },

 { 
        type: "Private Clinic",
        operatingHour: "Closed",
        name: "Grace Medical Clinic",
        distance: {
            km: "0.8 km",
            drive: "3 min drive"
        },
        address: "Oke-Ose, PMB 1515, Ilorin, Nigeria",
        tel: "+234 803 123 4567"
    },

 {
        type: "Campus Clinic",
        operatingHour: "Opens 24hrs",
        name: "University Health Services (Clinic)",
        distance: {
            km: "1.2 km",
            drive: "4 min drive"
        },
        address: "Main Campus, University of Ilorin, Nigeria",
        tel: "+234 803 999 8888"
    },


]
