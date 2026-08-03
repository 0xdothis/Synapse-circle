import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FlashIcon, Location06Icon, UserGroupIcon, CallIcon, StopWatchIcon, Shield02Icon } from "@hugeicons/core-free-icons"

export type dataType = {
   icon: React.ReactNode | string;
   title: string;
   description: string;
}
export type FAQType = {
   value: string;
   question: string;
   answer: string;
}

export const features: dataType[] = [
   {
      icon: <HugeiconsIcon icon={FlashIcon} size={24} color="#0D7377" />,
      title: "One-tap SOS",
      description: "Trigger an emergency alert instantly - no unlocking, no menus, no delay."
   },
   {
      icon: <HugeiconsIcon icon={Location06Icon} size={24} color="#0D7377" />,
      title: "Precise location",
      description: "Your exact GPS coordinates are shared the moment an alert is sent."
   },
   {
      icon: <HugeiconsIcon icon={UserGroupIcon} size={24} color="#0D7377" />,
      title: "Trusted contacts",
      description: "Up to three people who matter are notified at once via email and push."
   },
   {
      icon: <HugeiconsIcon icon={CallIcon} size={24} color="#0D7377" />,
      title: "Emergency directory",
      description: "Campus security, hospitals and hotlines — one call away, always."
   },
   {
      icon: <HugeiconsIcon icon={StopWatchIcon} size={24} color="#0D7377" />,
      title: "Smart countdown",
      description: "A short cancel window prevents false alarms while staying fast."
   },
   {
      icon: <HugeiconsIcon icon={Shield02Icon} size={24} color="#0D7377" />,
      title: "Private by design",
      description: "Location is only ever shared during an active alert. Nothing else."
   }
]

export const how_it_works: dataType[] = [
   {
      icon: "01",
      title: "Create your account",
      description: "Sign up in with your email in under 60 seconds to get started."
   },
   {
      icon: "02",
      title: "Add trusted contacts",
      description: "Add up to 3 people who will receive your emergency alert."
   },
   {
      icon: "03",
      title: "Alert with one tap",
      description: "In an emergency, tap the button. Contacts and campus security get your live location."
   },
   {
      icon: "04",
      title: "Help is on the way",
      description: "Your contacts and campus security receive your exact GPS location immediately."
   },

]

export const FAQs: FAQType[] = [
   {
      value: "item-1",
      question: "How does SafeWalk Campus work?",
      answer: "When you trigger an SOS, SafeWalk Campus immediately alerts your trusted contacts and campus security with your live location. Location sharing continues until you mark yourself as safe, helping responders reach you as quickly as possible."
   },
   {
      value: "item-2",
      question: "Who receives my SOS alert?",
      answer: "Your SOS alert is sent to your selected trusted contacts and your campus security team. They receive your live location so they can respond or assist immediately."
   },
   {
      value: "item-3",
      question: "How fast is an SOS alert sent?",
      answer: "Alerts are sent almost instantly after the confirmation countdown ends. This short countdown helps prevent accidental activations while ensuring emergencies are reported quickly."
   },
   {
      value: "item-4",
      question: "Is my location tracked all the time?",
      answer: "No. SafeWalk Campus only accesses and shares your location when you activate an SOS or when you've explicitly granted permission for emergency location sharing. Your location is not continuously monitored in the background."
   },
   {
      value: "item-5",
      question: "What happens if I trigger it by accident?",
      answer: "If you activate SOS by mistake, you can cancel it during the countdown before the alert is sent. If the alert has already been sent, you can end the SOS once you're safe, which notifies your trusted contacts and campus security that the emergency has ended."
   },

]
