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

const items = [
  { label: "Select Relationship", value: null },
  { label: "Mother", value: "mother" },
  { label: "Father", value: "father" },
  { label: "Wife", value: "wife" },
  { label: "Husband", value: "husband" },
  { label: "Sister", value: "sister" },
  { label: "Brother", value: "brother" },
  { label: "Uncle", value: "uncle" },
  { label: "Aunt", value: "aunt" }
]


export interface EmergencyContactStateProps {
  name: string;
  phone: string;
  email: string;
  relationship: string | null;
}

interface EmergencyContactProps {
  index: number;
  onChange: Function;
}

function EmergencyContact({ index, onChange }: EmergencyContactProps) {
  const [contact, setContact] = React.useState<EmergencyContactStateProps>({ name: "", email: "", phone: "", relationship: null });
  const [touched, setTouched] = React.useState(false)
  const isInvalid = touched && contact.relationship === null

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { id, value } = e.target;

    setContact((prev) => ({ ...prev, [id]: value }))
  }


  function handleChangeRelationship(id: keyof EmergencyContactStateProps) {
    return (value: string | null) => {
      setContact((prev) => ({ ...prev, [id]: value ?? null }))
      setTouched(true)
    }
  }

  console.log(touched, isInvalid)

  React.useEffect(() => {
    onChange(index, contact);
  }, [contact])

  return (
    <FieldSet className="w-full">
      <FieldDescription className=" -mb-2">EMERGENCY CONTACT {index + 1}</FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`name-${index}`}>Full Name <small className="text-error text-sm">*</small></FieldLabel>
          <Input id="name" type="text" placeholder="e.g Alex Johnson" value={contact.name} onChange={handleChange} required />
        </Field>
        <Field>
          <FieldLabel htmlFor={`phone-${index}`}>Phone Number <small className="text-error text-sm">*</small></FieldLabel>
          <Input id="phone" type="tel" placeholder="Enter a valid mobile number" value={contact.phone} onChange={handleChange} pattern="^\+?[1-9]?\d{1,14}$" required />
        </Field>
        <Field>
          <FieldLabel htmlFor={`email-${index}`}>Email Address <small className="text-error text-sm">*</small></FieldLabel>
          <Input id="email" type="email" value={contact.email} onChange={handleChange} pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" placeholder="sample@email.com" required />
        </Field>
        <Field>
          <FieldLabel htmlFor={`relationship-${index}`}>Relationship<small className="text-error text-sm">*</small></FieldLabel>

          <Select id="relationship" items={items} required onValueChange={handleChangeRelationship("relationship")}>
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
