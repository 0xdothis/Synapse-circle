import Button from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { useSuspenseQuery } from "@tanstack/react-query"
import { FullSpinner } from "@/components/Loader"
import { logout, userProfile } from "@/utils/safewalkFn"
import { useNavigate } from "react-router"

export default function Profile() {

  const navigate = useNavigate();

  const { data, isPending } = useSuspenseQuery({
    queryKey: ["getUser"],
    queryFn: userProfile
  })

  if (isPending) {
    return <FullSpinner />
  }

  console.log(data)

  function handleLogout() {

    logout();

    navigate(0);



  }

  return (
    <section className="relative pb-24 -mr-4 -ml-4">
      <div className="flex flex-col flex-1 sticky bg-neutral-50 w-full pb-4 pt-8 top-0 right-0 z-50 space-y-4 border-b border-b-neutral-200">

        <div className="px-4">
          <h2 className="text-neutral-900 font-bold text-2xl">Profile &amp; Settings</h2>
        </div>
      </div>
      <div>
        <div className="p-4 space-y-4">
          <div className="border border-neutral-200 bg-white p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="size-12 flex items-center text-primary font-bold justify-center bg-brand-100 rounded-full">TA</span>
              <div className="space-y-1">
                <h3 className="font-bold text-neutral-900">Tomi Adeyemi</h3>
                <small className="block text-xs text-neutral-700">tomi.adeyemi@email.com</small>
                <small className="block text-xs text-neutral-700"
                >University of Ilorin</small>
              </div>
            </div>
            <Button variant="outline">Edit Profile</Button>
          </div>

          <div className=" space-y-1.5">
            <h2 className="text-neutral-700 font-bold text-sm">TRUSTED CONTACTS (2)</h2>
            <ContactCard />
            <ContactCard />
          </div>

          <div className="space-y-2">
            <h2 className="text-neutral-700 font-bold text-sm">PRIVACY &amp; PERMISSIONS </h2>
            <div className="flex flex-col border border-neutral-200 rounded-lg">
              <div className="flex justify-between items-center p-3">
                <p className="font-medium text-neutral-900 text-sm">Save alert history</p>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-3 border-t border-t-neutral-200">
                <div>
                  <h3 className="text-sm text-neutral-900 font-medium">Location Permission</h3>
                  <small className="text-xs text-neutral-700">Granted</small>
                </div>
                <p className="text-xs text-neutral-700 font-semibold">Manage</p>
              </div>
              <div className="flex items-center justify-between p-3 border-t border-t-neutral-200">
                <div>
                  <h3 className="text-sm text-neutral-900 font-medium">Browser Notifications</h3>
                  <small className="text-xs text-neutral-700">Allowed</small>
                </div>
                <p className="text-xs text-neutral-700 font-semibold">Manage</p>
              </div>
            </div>
          </div>


          <div className="space-y-2">
            <h2 className="text-neutral-700 font-bold text-sm">HELP &amp; SUPPORT </h2>
            <div className="flex flex-col border border-neutral-200 rounded-lg">
              <div className="flex items-center justify-between p-3">

                <h3 className="text-sm text-neutral-900">Frequently Asked Questions</h3>
                <div className=" flex items-center justify-center text-neutral-700 font-semibold size-3.5">
                  <HugeiconsIcon icon={ArrowRight01Icon} className="w-full" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border-t border-t-neutral-200">

                <h3 className="text-sm text-neutral-900 font-medium">Contact Support</h3>
                <div className=" flex items-center justify-center text-neutral-700 font-semibold size-3.5">
                  <HugeiconsIcon icon={ArrowRight01Icon} className="w-full" />
                </div>

              </div>
              <div className="flex items-center justify-between p-3 border-t border-t-neutral-200">

                <h3 className="text-sm text-neutral-900 font-medium">Report a Problem</h3>
                <div className=" flex items-center justify-center text-neutral-700 font-semibold size-3.5">
                  <HugeiconsIcon icon={ArrowRight01Icon} className="w-full" />
                </div>

              </div>

            </div>
          </div>


          <div className="space-y-2">
            <h2 className="text-neutral-700 font-bold text-sm">ABOUT </h2>
            <div className="flex flex-col border border-neutral-200 rounded-lg">
              <div className="flex items-center justify-between p-3">

                <h3 className="text-sm text-neutral-900">App Version (V1.0)</h3>
                <div className=" flex items-center justify-center text-neutral-700 font-semibold size-3.5">
                  <HugeiconsIcon icon={ArrowRight01Icon} className="w-full" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border-t border-t-neutral-200">

                <h3 className="text-sm text-neutral-900 font-medium">Privacy Policy</h3>
                <div className=" flex items-center justify-center text-neutral-700 font-semibold size-3.5">
                  <HugeiconsIcon icon={ArrowRight01Icon} className="w-full" />
                </div>

              </div>
              <div className="flex items-center justify-between p-3 border-t border-t-neutral-200">

                <h3 className="text-sm text-neutral-900 font-medium">Terms &amp; Conditions</h3>
                <div className=" flex items-center justify-center text-neutral-700 font-semibold size-3.5">
                  <HugeiconsIcon icon={ArrowRight01Icon} className="w-full" />
                </div>

              </div>
              <div className="flex items-center justify-between p-3 border-t border-t-neutral-200">

                <h3 className="text-sm text-neutral-900 font-medium">Help &amp; Support</h3>
                <div className=" flex items-center justify-center text-neutral-700 font-semibold size-3.5">
                  <HugeiconsIcon icon={ArrowRight01Icon} className="w-full" />
                </div>

              </div>

            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button variant="outline" className="border-error text-error ring-error outline-error" onClick={handleLogout}> Logout</Button>
            <Button variant="destructive">Delete Account</Button>
          </div>



        </div>


      </div>

    </section>
  )
}

function ContactCard() {

  return (
    <div className="flex items-center justify-between space-y-1 border border-neutral-200 rounded-md p-3">
      <div>
        <h3 className="font-semibold text-xs text-neutral-900">Adeyemi Olamide</h3>
        <p className="text-neutral-600 text-xs">Parent &bull; +234 803 456 7890</p>
      </div>
      <Button variant="outline" size="sm">Edit</Button>
    </div>
  )
}

