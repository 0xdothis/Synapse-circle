import EmergencyContact from "@/components/onboarding/EmergencyContact";
import Button from "@/components/ui/button"
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { onboardingRegistration } from "@/utils/safewalkFn";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import Loader from "@/components/Loader"
import { trackEvent } from "@/lib/mixpanelClient";
import { toast } from "sonner";



function ContactForm() {

  const navigate = useNavigate()

  const contacts = useOnboardingStore(state => state.onboardingData.contacts)
  const addContactSlot = useOnboardingStore((state) => state.addContactSlot)
  const handleContactChange = useOnboardingStore(state => state.handleContactChange)
  const removeContactSlot = useOnboardingStore(state => state.removeContactSlot);

  const { isPending, mutate } = useMutation({
    mutationFn: onboardingRegistration,
    onSuccess: (data) => {

      if (!data.success) {
        toast.error(data.message)
        return

      }

      trackEvent("contact_added")
      toast.success("Emergency Contact Added ✅ ")

      // console.log(data)
      navigate("/onboarding/school-info")

    },
    onError: (err) => {
      console.log(err)
    }
  })



  function handleSubmitContacts(e: React.SubmitEvent<HTMLFormElement>) {

    e.preventDefault();

    if (contacts[0].name.trim() === "") {
      return;
    }

    const data = {
      step: "contacts",
      data: {
        contacts
      }
    }

    mutate(data)
  }

  if (isPending) {
    return <Loader heading="Setting up Contacts" description="We are Setting up your Emergency Contacts" />
  }




  return (
    <div className="mt-6">
      <div className="mb-6 space-y-2">
        <h3 className="text-2xl font-semibold text-neutral-900">Trusted Contacts</h3>
        <p className="text-neutral-700 text-sm">Add up to 3 emergency contacts. They'll be notified immediately when you activate SOS.</p>
      </div>
      <form className="space-y-6" onSubmit={handleSubmitContacts}>
        {contacts.map((contact, index) => (
          <div key={index} className="space-y-4 flex flex-col">
            {contacts.length > 1 && <a onClick={() => removeContactSlot(index)} className="rounded-lg h-12 w-12 p-0 text-error cursor-pointer self-end relative top-15 right-5">
              Remove
            </a>}

            <EmergencyContact index={index} contact={contact} onChange={(updated) => handleContactChange(index, updated)} />
          </div>
        ))}

        <div className="space-y-8">

          <Button type="button" onClick={addContactSlot} disabled={contacts.length === 3} className="border border-brand-500 border-dashed bg-neutral-50 text-brand-500 gap-2 w-full active:bg-neutral-50 hover:bg-transparent  hover:text-brand-700 focus:bg-neutral-50"><HugeiconsIcon icon={Add01Icon} size={20} /> Add another contact</Button>

          <Button className="w-full" type="submit">Continue</Button>
        </div>
      </form >
    </div >

  )
}


export default ContactForm
