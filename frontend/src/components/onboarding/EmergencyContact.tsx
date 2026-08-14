import React from "react"
import { FieldSet, FieldDescription, FieldLabel, Field, FieldGroup } from "../ui/field"
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/utils";
import type { ContactDTO } from "@/types";

const items = [
  { label: "Select Relationship", value: null },
  { label: "Parent", value: "parent" },
  { label: "Friend", value: "friend" },
  { label: "Roommate", value: "roommatr" },
  { label: "Partner", value: "partner" },
  { label: "Other", value: "other" }
]

export interface EmergencyContactStateProps {
  name: string;
  phoneNumber: string;
  email: string;
  relationship: string | null;
}

interface EmergencyContactProps {
  index?: number;
  contact: ContactDTO;
  onChange: (updatedContact: ContactDTO) => void;
}

function EmergencyContact({ index, contact, onChange }: EmergencyContactProps) {

  const [touched, setTouched] = React.useState(false)
  const isInvalid = touched && contact.relationship === null

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { id, value } = e.target;

    if (!contact) return;

    onChange({
      ...contact,
      [id]: value
    })
  }


  function handleChangeRelationship(value: string | null) {
    if (!contact) return;
    setTouched(true)

    onChange({
      ...contact,
      relationship: value ?? null
    })

  }



  return (
    <FieldSet className="w-full">
      {<FieldDescription className=" -mb-2">EMERGENCY CONTACT {index! + 1}</FieldDescription>}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`name-${index}`}>Full Name <small className="text-error text-sm">*</small></FieldLabel>
          <Input id="name" type="text" placeholder="e.g Alex Johnson" value={contact.name} onChange={handleChange} required />
        </Field>
        <Field>
          <FieldLabel htmlFor={`phone-${index}`}>Phone Number <small className="text-error text-sm">*</small></FieldLabel>
          <Input id="phoneNumber" type="tel" placeholder="Enter a valid mobile number" value={contact.phoneNumber} onChange={handleChange} pattern="^\+?[1-9]?\d{1,14}$" required />
        </Field>
        <Field>
          <FieldLabel htmlFor={`email-${index}`}>Email Address <small className="text-error text-sm">*</small></FieldLabel>
          <Input id="email" type="email" value={contact.email} onChange={handleChange} placeholder="sample@email.com" required />
        </Field>
        <Field>
          <FieldLabel htmlFor={`relationship-${index}`}>Relationship<small className="text-error text-sm">*</small></FieldLabel>

          <Select id="relationship" items={items} required onValueChange={handleChangeRelationship} value={contact.relationship || null}>
            <SelectTrigger className={cn("w-full",
              `${isInvalid && "border-error ring-2 ring-error/20"}`,
              `${touched && contact.relationship !== null && "border-success"}`)}>
              <SelectValue placeholder="Select Relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Select Relationship</SelectLabel>

                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

        </Field>

      </FieldGroup>
    </FieldSet>
  )

}

export default EmergencyContact
