import Button from "@/components/ui/button"
import { useNavigate } from "react-router"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import Loader from "@/components/Loader"
import { Field, FieldSet, FieldGroup, FieldLabel } from "@/components/ui/field"
import React from "react"
import { nigerianTertiarySchools } from "@/schools"
import { useOnboardingStore } from "@/store/useOnboardingStore"
import { useMutation } from "@tanstack/react-query"
import { onboardingRegistration } from "@/utils/safewalkFn"
import { trackEvent } from "@/lib/mixpanelClient"

const schools = nigerianTertiarySchools

interface Institution {
  name: string;
  acronym: string;
}


function SchoolForm() {
  const navigate = useNavigate()
  const [institution, setInstitution] = React.useState<Institution | null>(null)
  const updateSchool = useOnboardingStore(state => state.handleUniversityChange)
  //const newSchool = useOnboardingStore(state => state.onboardingData.selectedUniversity)
  const [touched, setTouched] = React.useState(false)

  function handleChangeInstitution(value: string | null) {

    setTouched(true)

    if (!value) {
      setInstitution(null);
      return
    }

    const selectedSchool = schools.find(school => school.name === value);

    if (selectedSchool) {
      setInstitution(selectedSchool)
      updateSchool(selectedSchool)
    }
  }


  const { isPending, mutate } = useMutation({
    mutationFn: onboardingRegistration,
    onSuccess: (data) => {

      if (!data.success) {
        return

      }

      trackEvent("university_added")

      console.log(data)
      navigate("/dashboard", { replace: true })

    },
    onError: (err) => {
      console.log(err)
    }
  })



  function handleSubmitSchool() {


    if (institution?.name.trim() === "") {
      return;
    }

    const data = {
      step: "university",
      data: {
        name: institution?.name,
        acronym: institution?.acronym
      }
    }

    mutate(data)
  }


  if (isPending) { return <Loader heading="Setting up your University" description="We are Setting up your University" /> }



  return (
    <div className="mt-6 flex-1 flex flex-col">
      <div className="mb-6 space-y-2">
        <div>
          <h3 className="text-2xl font-semibold text-neutral-900">Institution Information</h3>
          <p className="text-neutral-700 text-sm">Help us match your account to your campus security team.</p>
        </div>
        <form className="space-y-6 flex flex-col" onSubmit={handleSubmitSchool}>
          <FieldSet className="w-full">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="institution">Institution <small className="text-error text-sm">*</small></FieldLabel>

                <Combobox items={schools} id="institution" onValueChange={handleChangeInstitution} required>
                  <ComboboxInput placeholder="Select a institution" data-valid={touched && institution !== null}
                    data-invalid={touched && institution === null} required />
                  <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item.name} value={item.name}>
                          {item.name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
            </FieldGroup>
          </FieldSet>

        </form >

      </div>
      <Button className="mt-auto" onClick={handleSubmitSchool}>Continue</Button>
    </div >
  )
}

export default SchoolForm
