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
      description: "Up to three people who matter are notified at once via SMS and push."
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
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ut magna id enim varius porttitor. Nullam volutpat leo in risus sollicitudin, vitae vestibulum tortor viverra. Sed porttitor mi in nulla pulvinar auctor vel at justo. Proin at posuere mi. Donec gravida vitae risus eu vulputate. Duis tempor augue non odio consectetur, sit amet porttitor justo viverra. Ut quis lectus est."
   },
   {
      value: "item-2",
      question: "Who receives my SOS alert?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ut magna id enim varius porttitor. Nullam volutpat leo in risus sollicitudin, vitae vestibulum tortor viverra. Sed porttitor mi in nulla pulvinar auctor vel at justo. Proin at posuere mi. Donec gravida vitae risus eu vulputate. Duis tempor augue non odio consectetur, sit amet porttitor justo viverra. Ut quis lectus est."
   },
   {
      value: "item-3",
      question: "How fast is an SOS alert sent?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ut magna id enim varius porttitor. Nullam volutpat leo in risus sollicitudin, vitae vestibulum tortor viverra. Sed porttitor mi in nulla pulvinar auctor vel at justo. Proin at posuere mi. Donec gravida vitae risus eu vulputate. Duis tempor augue non odio consectetur, sit amet porttitor justo viverra. Ut quis lectus est."
   },
   {
      value: "item-4",
      question: "Is my location tracked all the time?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ut magna id enim varius porttitor. Nullam volutpat leo in risus sollicitudin, vitae vestibulum tortor viverra. Sed porttitor mi in nulla pulvinar auctor vel at justo. Proin at posuere mi. Donec gravida vitae risus eu vulputate. Duis tempor augue non odio consectetur, sit amet porttitor justo viverra. Ut quis lectus est."
   },
   {
      value: "item-5",
      question: "What happens if I trigger it by accident?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ut magna id enim varius porttitor. Nullam volutpat leo in risus sollicitudin, vitae vestibulum tortor viverra. Sed porttitor mi in nulla pulvinar auctor vel at justo. Proin at posuere mi. Donec gravida vitae risus eu vulputate. Duis tempor augue non odio consectetur, sit amet porttitor justo viverra. Ut quis lectus est."
   },

]
