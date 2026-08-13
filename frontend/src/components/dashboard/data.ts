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
            km: number;
            drive: number;
        },
        address: string;
        tel: string;

}

export type AlertProps = {
    id?: string;
    tag: string;
    title: string;
    time: string;
    school: string;
    duration: number;

}


export const hospitals: HospitalProps[] = [
    {
        tag: "nearest",
        type: "Teaching Hospital",
        operatingHour: "Opens 24hrs",
        name: "University of Ilorin Teaching Hospital",
        distance: {
            km: 0.8,
            drive: 3
        },
        address: "Oke-Ose, PMB 1515, Ilorin, Nigeria",
        tel: "+234 803 123 4567"
    },
 { 
        type: "General Hospital",
        operatingHour: "Opens 24hrs",
        name: "General Hospital Ilorin",
        distance: {
            km: 2.4,
            drive: 8
        },
        address: "Adewole Area, Ilorin, Nigeria",
        tel: "+234 802 987 6543"
    },

 { 
        type: "Private Clinic",
        operatingHour: "Closed",
        name: "Grace Medical Clinic",
        distance: {
            km: 0.8,
            drive: 3
        },
        address: "Oke-Ose, PMB 1515, Ilorin, Nigeria",
        tel: "+234 803 123 4567"
    },

 {
        type: "Campus Clinic",
        operatingHour: "Opens 24hrs",
        name: "University Health Services (Clinic)",
        distance: {
            km: 1.2,
            drive: 4
        },
        address: "Main Campus, University of Ilorin, Nigeria",
        tel: "+234 803 999 8888"
    },


]


export const alerts: AlertProps[] = [
    {
        tag: "Resolved",
        title: "Emergency Alert",
        time: "12 July 2026 — 8:43 PM",
        school: "University of Ilorin",
        duration: 12
    },
{
        tag: "False Alarm",
        title: "Emergency Alert",
        time: "28 June 2026 — 3:15 PM",
        school: "Student Union Building",
        duration: 2
    },

 {
        tag: "Resolved",
        title: "Emergency Alert",
        time: "15 June 2026 — 11:20 PM",
        school: "Faculty of Science",
        duration: 8
    }
]
