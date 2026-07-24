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

export function PrivacyPolicy({ className, text = "Privacy" }: { className?: string; text?: string }) {
  return (
    <Dialog>
      <DialogTrigger nativeButton={false} render={<a className={cn(className)}>{text}</a>} />
      <DialogContent className="lg:min-w-4xl md:min-w-2xl">
        <DialogHeader className="items-center">
          <Logo />
          <DialogTitle className="lg:text-3xl font-bold pt-4">{text}</DialogTitle>
          <DialogDescription>
            Last updated: 21/07/2026
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 text-neutral-700">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">1. Introduction</h2>
            <p className="mb-3 leading-relaxed">
              SafeWalk Campus ("we", "our", "the App") is an emergency alert application that allows users to
              notify designated family members and their university's Chief Security Officer with their live
              location when they feel unsafe. This Privacy Policy explains what information we collect, how we
              use it, and the choices you have.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed text-neutral-900">
              <li><strong className="text-neutral-900">Account information:</strong> <span className="text-neutral-700">your name, email address, password (stored in encrypted/hashed form — we never store your password in plain text), and university name.</span></li>
              <li><strong className="text-neutral-900">Trusted contact information:</strong> <span className="text-neutral-700">the name, phone number, and email address of the two family members you designate.</span></li>
              <li><strong className="text-neutral-900">University information:</strong> <span className="text-neutral-700">the university you select, used to link you to the correct Chief Security Officer contact.</span></li>
              <li><strong className="text-neutral-900">Location data:</strong> <span className="text-neutral-700">your device's location, collected only at the landing page or the moment you trigger an SOS alert, or a false alarm correction. We do not track or store your location in the background or at any other time.</span></li>
              <li><strong className="text-neutral-900">Usage data:</strong> <span className="text-neutral-700">basic in-app activity (e.g. sign-up completed, onboarding steps completed, SOS button taps, alert delivery status, and feature usage such as SOS triggered) collected through our analytics tool, used to understand and improve the product. Device and technical information such as device type, operating system, and approximate timestamps, collected through our analytics provider (Mixpanel).</span></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed text-neutral-900">
              <li><span className="text-neutral-700">To create and manage your account.</span></li>
              <li><span className="text-neutral-700">To send an SOS alert, including your live location, to your designated family contacts and your university's Chief Security Officer when you trigger it.</span></li>
              <li><span className="text-neutral-700">To send a false-alarm correction message to the same recipients if you cancel an alert.</span></li>
              <li><span className="text-neutral-700">To notify you once your alert has been received by a recipient, where this feature is available.</span></li>
              <li><span className="text-neutral-700">To understand product usage and improve SafeWalk Campus, using aggregated, non-identifying analytics where possible.</span></li>
              <li><span className="text-neutral-700">To verify your identity during sign-up and login.</span></li>
              <li><span className="text-neutral-700">To understand how the App is used so we can fix problems and improve features.</span></li>
              <li><span className="text-neutral-700">To maintain the security and integrity of the App.</span></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">4. Third-Party Services</h2>
            <p className="mb-3 leading-relaxed">
              We rely on the following third-party services to operate SafeWalk Campus. Each processes a
              limited set of your data solely to perform its function:
            </p>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed text-neutral-900">
              <li><strong className="text-neutral-900">Email delivery provider</strong> <span className="text-neutral-700">— used to send verification emails and SOS/false-alarm alert emails.</span></li>
              <li><strong className="text-neutral-900">Analytics tool (Mixpanel)</strong> <span className="text-neutral-700">— used to track in-app usage events to improve the product.</span></li>
              <li><strong className="text-neutral-900">Hosting/database provider</strong> <span className="text-neutral-700">— used to securely store your account and alert data.</span></li>
            </ul>
            <p className="mt-3 leading-relaxed">We do not sell your personal information to third parties.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">5. Data Retention</h2>
            <p className="leading-relaxed">
              We retain your account information for as long as you maintain an active account. Alert history
              is retained so you can view your own past alerts. If you delete your account, we will delete or
              anonymize your personal information, except where we are required to retain certain information
              for legal or safety reasons. You may request deletion of your account and associated data at any
              time by contacting us (see Section 9).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">6. Your Rights</h2>
            <p className="mb-3 leading-relaxed">Under the Nigeria Data Protection Act (NDPA) 2023 and applicable data protection laws, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed text-neutral-900">
              <li><span className="text-neutral-700">Access and update your account information and trusted contacts at any time within the app.</span></li>
              <li><span className="text-neutral-700">Request a copy of the personal data we hold about you.</span></li>
              <li><span className="text-neutral-700">Request deletion of your account and data, subject to any legal record-keeping requirements.</span></li>
              <li><span className="text-neutral-700">Withdraw consent for non-essential data uses (such as analytics) where applicable.</span></li>
              <li><span className="text-neutral-700">Withdraw consent to data processing at any time (note: withdrawing consent for location access will prevent SOS alerts from including your location).</span></li>
              <li><span className="text-neutral-700">Lodge a complaint with the Nigeria Data Protection Commission (NDPC) if you believe your data has been mishandled.</span></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">7. Data Security</h2>
            <p className="leading-relaxed">
              We take reasonable technical measures to protect your data, including secure password handling
              and encrypted data transmission. However, no system is completely secure, and we cannot guarantee
              absolute security of information transmitted to or from the App.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">8. Children's Privacy</h2>
            <p className="leading-relaxed">
              SafeWalk Campus is intended for university students and is not directed at children under 13. We
              do not knowingly collect data from users under 13. If we become aware that we have inadvertently
              collected such information, we will take steps to delete it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mt-8 mb-3 text-neutral-900">9. Contact Us</h2>
            <p className="leading-relaxed">
              For questions about this Privacy Policy or to exercise your data rights, contact:{" "}
              <a href="mailto:onyijohn556@gmail.com" className="text-primary hover:underline">onyijohn556@gmail.com</a>.
            </p>
          </section>
        </div>
        <DialogFooter>
          <DialogClose render={<Button>Accept</Button>} />
          <DialogClose render={<Button variant="outline">Close</Button>} />

        </DialogFooter>
      </DialogContent>
    </Dialog >
  )
}

export default PrivacyPolicy
