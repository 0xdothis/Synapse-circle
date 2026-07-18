import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Button from "@/components/ui/button"
import Terms from "./ui/Terms";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, Eye } from "@hugeicons/core-free-icons";
import { useNavigate } from "react-router";

function CreateAccount() {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col justify-center items-center">

      <Button className="self-start gap-2" variant="ghost" onClick={() => navigate(-1)}><HugeiconsIcon icon={ArrowLeft02Icon} /> Back</Button>
      <form className="flex flex-col space-y-14">
        <FieldSet className="w-full max-w-xs">
          <FieldLegend>Create Account</FieldLegend>
          <FieldDescription>Create your SafeWalk Campus account to get started.</FieldDescription>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name <small className="text-error text-sm">*</small></FieldLabel>
              <Input id="name" type="text" placeholder="e.g Alex Johnson" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email Address <small className="text-error text-sm">*</small></FieldLabel>
              <Input id="email" type="text" placeholder="sample@email.com" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password <small className="text-error text-sm">*</small></FieldLabel>
              <Input id="password" type="password" placeholder="Min. 8 characters" required endIcon={Eye} />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm_password">Full Name <small className="text-error text-sm">*</small></FieldLabel>
              <Input id="confirm_password" type="password" placeholder="Confirm your password" required />
            </Field>
          </FieldGroup>
        </FieldSet>

        <Button className="" disabled>Create Account</Button>
      </form>

      <Terms />

    </section>
  )

}

export default CreateAccount;
