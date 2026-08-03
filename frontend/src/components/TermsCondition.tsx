import Button from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Logo from "./navigation/Logo"
import { cn } from "@/utils";

export function TermsCondition({ className, text = "Terms" }: { className?: string; text?: string }) {
  return (
    <Dialog>
      <DialogTrigger nativeButton={false} render={<a className={cn(className)}>{text}</a>} />
      <DialogContent className="lg:min-w-4xl md:min-w-2xl">
        <DialogHeader className="items-center">
          <Logo />
          <DialogTitle className="lg:text-3xl font-bold pt-4">Terms & Conditions</DialogTitle>
          <DialogDescription>
            Last updated: 21/07/2026
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 text-neutral-700">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By creating an account and using SafeWalk Campus, you agree to these Terms & Conditions and
              the Privacy Policy above.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">2. Description of Service</h2>
            <p className="leading-relaxed">
              SafeWalk Campus is a one-tap emergency alert tool that shares your live location with
              contacts you designate, by email, when you trigger an SOS alert. It is designed to
              supplement, not replace, official emergency services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">3. Important Limitations — Please Read Carefully</h2>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed text-neutral-900">
              <li><span className="text-neutral-700">SafeWalk Campus is <strong className="text-neutral-900">NOT</strong> a substitute for calling official emergency services (e.g. police, ambulance). In a life-threatening emergency, always contact official emergency responders directly wherever possible.</span></li>
              <li><span className="text-neutral-700">Alert delivery depends on internet connectivity, email service availability, and your device's location services. We cannot guarantee that an alert will be delivered, delivered on time, or received by any recipient.</span></li>
              <li><span className="text-neutral-700">Your designated contacts are individuals you choose. SafeWalk Campus has no control over whether, when, or how they respond to an alert.</span></li>
              <li><span className="text-neutral-700">Location accuracy depends on your device and environment (e.g. GPS signal, indoor vs. outdoor). Location shared may not always be precise.</span></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">4. User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed text-neutral-900">
              <li><span className="text-neutral-700">You must provide accurate information for your trusted contacts so alerts reach real, reachable people.</span></li>
              <li><span className="text-neutral-700">You must not use the False Alarm feature to send misleading corrections in bad faith.</span></li>
              <li><span className="text-neutral-700">You must not misuse the SOS feature for purposes other than genuine safety concerns.</span></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">5. Account Security</h2>
            <p className="leading-relaxed">
              You are responsible for keeping your account credentials secure. Notify us immediately if
              you believe your account has been compromised.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">6. Limitation of Liability</h2>
            <p className="leading-relaxed">
              To the fullest extent permitted by law, SafeWalk Campus and its team are not liable for any
              harm, loss, or damages arising from: failure or delay of alert delivery, inaccurate location
              data, actions or inactions of your designated contacts or university security personnel, or
              any other circumstances beyond our reasonable control. SafeWalk Campus is provided "as is"
              during this MVP/pilot phase, without warranties of any kind.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">7. Changes to These Terms</h2>
            <p className="leading-relaxed">
              We may update these Terms from time to time. Continued use of the App after changes are
              posted constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">8. Governing Law</h2>
            <p className="leading-relaxed">
              These Terms are governed by the laws of the Federal Republic of Nigeria.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">9. Contact Us</h2>
            <p className="leading-relaxed">
              Questions about these Terms can be directed to:{" "}
              <a href="mailto:onyijohn556@gmail.com" className="text-primary hover:underline">onyijohn556@gmail.com</a>.
            </p>
          </section>
        </div>
        <DialogFooter>

          <DialogClose render={<Button variant="outline">Close</Button>} />

        </DialogFooter>
      </DialogContent>
    </Dialog >
  )
}

export default TermsCondition

