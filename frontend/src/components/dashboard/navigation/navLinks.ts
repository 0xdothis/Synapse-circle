import type {IconSvgElement} from "@hugeicons/react"

import {Home01Icon, Hospital02Icon, Clock02Icon, UserSettings01Icon } from "@hugeicons/core-free-icons"

export interface NavLinkItem {
  label: string;
  sectionId: string;
    icon: IconSvgElement
}

export const navLinks = [
  {
    label: "Home",
    sectionId: "home",
    icon: Home01Icon
  },
  {
    label: "Directory",
    sectionId: "directory",
    icon: Hospital02Icon
  },
  {
    label: "Alerts",
    sectionId: "alerts",
    icon: Clock02Icon
  },
  {
    label: "Profile",
    sectionId: "profile",
    icon:UserSettings01Icon
  },
];

export const deskstopLinks = [
   {
    label: "Home",
    to: "/dashboard",
    sectionId: "dashboard",
    icon: Home01Icon,
    end: true
  },
  {
    label: "Hospital Directory",
    to: "/dashboard/directory",
    sectionId: "directory",
    icon: Hospital02Icon
  },
  {
    label: "Alert History",
    to: "/dashboard/history",
    sectionId: "history",
    icon: Clock02Icon
  },
  {
    label: "Profile & Settings",
    to: "/dashboard/profile",
    sectionId: "profile",
    icon:UserSettings01Icon
  },

]
