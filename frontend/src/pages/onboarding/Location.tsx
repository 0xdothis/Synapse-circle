import Template from "@/components/onboarding/Template";
import { AlertIcon, Location06Icon, LocationCheck02Icon, LocationOffline03Icon } from "@hugeicons/core-free-icons";
import Button from "@/components/ui/button"
import useLocation from "../../utils/hooks/useLocation"
import { useNavigate } from "react-router";
import { Spinner } from "@/components/Loader";
import Modal from "@/components/onboarding/Modal";
import { DialogClose } from "@/components/ui/dialog";



function Location() {

  const { permissionStatus, getLocation, loading } = useLocation();
  const navigate = useNavigate()

  // Determine button text safely based on permission state
  const getButtonText = (() => {
    if (permissionStatus === 'granted') return 'Continue';
    if (permissionStatus === 'denied') return 'Enable Location';
    return 'Allow Location Access';
  })();

  function handleLocation() {

    getLocation();

    if (permissionStatus === "granted") {
      navigate("/onboarding/trusted-contact")
    }

  }


  return (

    <Template heading={
      getButtonText === "Enable Location" && "Location Sharing Disabled" ||
      getButtonText === "Allow Location Access" && "Enable Location" ||
      getButtonText === "Continue" && "Location Access Enabled"}
      description={
        getButtonText === "Enable Location" && `Location access is turned off SafeWalk Campus needs your location to provide real-time route safety.To enable it` ||
        getButtonText === "Allow Location Access" && "SafeWalk Campus needs your location to send alerts fast when it matters." ||
        getButtonText === "Continue" && "SafeWalk Campus shares your location with emergency contacts and campus security for help."
      }
      icon={getButtonText === "Enable Location" && LocationOffline03Icon ||
        getButtonText === "Allow Location Access" && Location06Icon ||
        LocationCheck02Icon}>

      <Button onClick={handleLocation} className=""> {loading ? <> <Spinner size="md" className="bg-neutral-50" /> <span className="inline-block ml-2"> Loading</span></> : getButtonText} </Button>
      {getButtonText === "Continue" ? undefined : <Modal trigger="Not Now" icon={AlertIcon} title="Are you sure?" description="Enable location access to share your real-time location with trusted contacts during emergencies.">
        <DialogClose render={<Button variant="ghost" onClick={() => navigate("/onboarding/trusted-contact")}>Continue Without Location</Button>} />

        <DialogClose render={<Button onClick={() => handleLocation()}>Enable Location</Button>} />
      </Modal>
      }

    </Template >

  )
}

export default Location;

