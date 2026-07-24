import { useNavigate } from "react-router";
import Template from "@/components/onboarding/Template";
import Button from "@/components/ui/button"
import { UserGroupIcon, AlertIcon } from "@hugeicons/core-free-icons";
import Modal from "@/components/onboarding/Modal";
import { DialogClose } from "@/components/ui/dialog"




function TrustedContact() {

  const navigate = useNavigate()
  return (
    <>
      <Template heading="Set Up Trusted Contacts" description="Add trusted contacts who will be notified when you trigger a SafeWalk Campus alert. They'll receive your live location and status updates." icon={UserGroupIcon}>
        <Button onClick={() => navigate("/onboarding/contact-form")}>Add Trusted Contacts</Button>
        <Modal trigger="Not Now" icon={AlertIcon} title="Are you sure?" description="Without this step, no one will be notified if you trigger a safety alert while walking alone.">
          <DialogClose render={<Button variant="ghost" onClick={() => navigate("/onboarding/school-info")}>Continue Without Contacts</Button>} />

          <DialogClose render={<Button onClick={() => navigate("/onboarding/contact-form")}>Add Trusted Contacts</Button>} />
        </Modal>

      </Template>

    </>
  )
}

export default TrustedContact;
