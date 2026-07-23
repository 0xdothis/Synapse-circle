//import { useNavigate } from "react-router";
import EmergencyContact, { type EmergencyContactStateProps } from "@/components/onboarding/EmergencyContact";
import Button from "@/components/ui/button"
import { Add01Icon, Trash2 } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import React from "react";
import { useNavigate } from "react-router";



function ContactForm() {

  const navigate = useNavigate()
  const [contacts, setContacts] = React.useState<EmergencyContactStateProps[]>([
    { name: "", email: "", phone: "", relationship: "" }
  ])




  const handleContactChange = (index: number, updatedContact: EmergencyContactStateProps) => {
    setContacts(prev => {
      const newContacts = [...prev]
      newContacts[index] = updatedContact

      return newContacts;
    })
  }

  const addContactSlot = () => {
    setContacts((prev) => [...prev, { name: "", email: "", phone: "", relationship: "" }
    ])
  }

  const removeContactSlot = (indexToRemove: number) => {
    if (contacts.length > 1) {
      setContacts(prev => prev.filter((_, index) => index !== indexToRemove))
    }

  }

  return (
    <div className="mt-6">
      <div className="mb-6 space-y-2">
        <h3 className="text-2xl font-semibold text-neutral-900">Trusted Contacts</h3>
        <p className="text-neutral-700 text-sm">Add up to 3 emergency contacts. They'll be notified immediately when you activate SOS.</p>
      </div>
      <form className="space-y-6">
        {contacts.map((_, index) => (
          <div key={index} className="space-y-4">
            <EmergencyContact index={index} onChange={handleContactChange} />
            {contacts.length > 1 && <Button type="button" onClick={() => removeContactSlot(index)} variant="destructive" size="sm" className="rounded-lg h-12 w-12 p-0 active:bg-error focus:bg-error">
              <HugeiconsIcon icon={Trash2} strokeWidth={2} size={30} />
            </Button>}
          </div>
        ))}

        <div className="space-y-8">

          <Button type="button" onClick={addContactSlot} className="border border-brand-500 border-dashed bg-neutral-50 text-brand-500 gap-2 w-full active:bg-neutral-50 focus:bg-neutral-50"><HugeiconsIcon icon={Add01Icon} size={20} /> Add another contact</Button>

          <Button className="w-full" onClick={() => navigate("/onboarding/school-info")}>Continue</Button>
        </div>
      </form >
    </div >

  )
}


export default ContactForm
