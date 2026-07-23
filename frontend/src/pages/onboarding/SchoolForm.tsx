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

import { Field, FieldSet, FieldGroup, FieldLabel } from "@/components/ui/field"
import React from "react"

const frameworks = [
  "Next.js",
  "SvelteKit",
  "Nuxt.js",
  "Remix",
  "Astro",
] as const

function SchoolForm() {
  const navigate = useNavigate()
  const [institution, setInstitution] = React.useState<string | null>(null)
  const [touched, setTouched] = React.useState(false)


  function handleChangeInstitution() {
    return (value: string | null) => {
      setInstitution(value)
      setTouched(true)
    }
  }





  return (
    <div className="mt-6 flex-1 flex flex-col">
      <div className="mb-6 space-y-2">
        <div>
          <h3 className="text-2xl font-semibold text-neutral-900">Institution Information</h3>
          <p className="text-neutral-700 text-sm">Help us match your account to your campus security team.</p>
        </div>
        <form className="space-y-6 flex flex-col">
          <FieldSet className="w-full">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="institution">Institution <small className="text-error text-sm">*</small></FieldLabel>

                <Combobox items={frameworks} id="institution" onValueChange={handleChangeInstitution} required>
                  <ComboboxInput placeholder="Select a institution" data-valid={touched && institution !== null}
                    data-invalid={touched && institution === null} required />
                  <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
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
      <Button className="mt-auto" onClick={() => navigate("/dasboard")}>Continue</Button>
    </div >
  )
}

export default SchoolForm
