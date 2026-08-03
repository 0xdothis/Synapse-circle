import { useNavigate } from "react-router";
import Template from "@/components/onboarding/Template";
import Button from "@/components/ui/button"
import { UserGroupIcon, AlertIcon } from "@hugeicons/core-free-icons";
import Modal from "@/components/onboarding/Modal";
import { DialogClose } from "@/components/ui/dialog"
import { trackEvent } from "@/lib/mixpanelClient";




function SchoolInfo() {

  const navigate = useNavigate()

  function submitSkipOnboarding() {

    trackEvent("onboarding_abandoned");

    navigate("/dashboard")


  }
  return (
    <>
      <Template heading="Enter Institution Information" description="Tell us your campus details so SafeWalk Campus can customize routes, safety zones, and alerts for your institution." icon={UserGroupIcon}>
        <Button onClick={() => navigate("/onboarding/school-form")}>Add Institution Details</Button>

        <Modal trigger="Not Now" icon={AlertIcon} title="Are you sure?" description="Without this step, no one will be notified if you trigger a safety alert while walking alone.">
          <DialogClose render={<Button variant="ghost" onClick={submitSkipOnboarding}>Continue Without Info</Button>} />

          <DialogClose render={<Button>Go Back & Add Details</Button>} />
        </Modal>
      </Template>

    </>
  )
}


export default SchoolInfo;

