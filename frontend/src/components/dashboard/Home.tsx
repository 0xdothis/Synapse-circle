
import Header from "./Header"
import Button from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { useNavigate } from "react-router"
import { useMutation } from "@tanstack/react-query"
import { triggerSOS } from "@/utils/safewalkFn"
import { useOnboardingStore } from "@/store/useOnboardingStore"

function Home() {
  const navigate = useNavigate()
  const location = useOnboardingStore(state => state.onboardingData.location)

  const { mutate } = useMutation({
    mutationFn: triggerSOS,
    onSuccess: (data) => {

      console.log(data)
      navigate("countdown")
    },
    onError: (err) => {
      console.log(err)
    }
  })


  function handleSOSTrigger() {

    mutate({ ...location, locationAvailable: true })
  }


  return (
    <section className="relative pt-4 pb-16">
      <Header title="University of Ilorin" caption="Good Evening, " name="Tomi"
      />
      <div className="mt-22 scroll-mt-20 mb-5">
        <div>
          <div className="flex size-40 rounded-full bg-[#FEE2E2] justify-center items-center mx-auto">
            <Button variant="sos" className="size-32.5 rounded-full font-black text-3xl" onClick={handleSOSTrigger}>SOS</Button>
          </div>

          <div className="space-y-6">
            <div className="text-center mt-6">
              <p className="text-neutral-900 font-medium">Hold or tap to request emergency help.</p>
              <p className="text-sm text-neutral-700">Initiates 5 second countdown before notifying dispatchers and contacts.</p>
            </div>
            <div className="space-y-2.5">
              <div className="bg-white p-3 rounded-lg shadow-md space-y-1.5">
                <h3 className="font-semibold text-neutral-900">Campus Security</h3>
                <small className="block text-neutral-600 text-sm">Institution Security Office</small>
                <a className="text-sm font-semibold text-neutral-700 inline-flex items-center gap-2">View Details <HugeiconsIcon icon={ArrowRight01Icon} size={16} /></a>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-md space-y-1.5">
                <h3 className="font-semibold text-neutral-900">Campus Security</h3>
                <small className="block text-neutral-600 text-sm">Institution Security Office</small>
                <a className="text-sm font-semibold text-neutral-700 inline-flex items-center gap-2">View Details <HugeiconsIcon icon={ArrowRight01Icon} size={16} /></a>
              </div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-neutral-900 text-sm font-bold">Trusted Contacts</h3>
              <p className="text-xs text-neutral-700 font-semibold">Manage Contacts</p>
            </div>
          </div>
          <div className="">
            <div className="py-2 flex items-center justify-between border-b border-b-neutral-100">
              <div className="">
                <p className="font-semibold text-neutral-900 text-xs">Adeyemi Olamide</p>
                <p className="text-xs text-neutral-600">Parent</p>
              </div>
              <p className="text-neutral-900 text-sm">+234 803 456 7890</p>
            </div>

            <div className="py-2 flex items-center justify-between">
              <div className="">
                <p className="font-semibold text-neutral-900 text-xs">Adeyemi Olamide</p>
                <p className="text-xs text-neutral-600">Parent</p>
              </div>
              <p className="text-neutral-900 text-sm">+234 803 456 7890</p>
            </div>

          </div>
        </div>
      </div >
    </section >
  )
}

export default Home
