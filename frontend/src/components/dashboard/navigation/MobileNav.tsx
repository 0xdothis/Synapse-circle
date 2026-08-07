import { HugeiconsIcon } from "@hugeicons/react"
import { navLinks } from "./navLinks"
import { NavLink } from "react-router"


function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 right-0 left-0 w-full z-50 bg-neutral-50 p-4 border-t border-neutral-300">
      <ul className="flex justify-between">
        {navLinks.map(({ sectionId, label, to, icon, end }) => (
          <NavLink to={to} key={sectionId} end={end} className={({ isActive }) => `flex flex-col hover:text-brand-500 justify-center items-center space-y-1 ${isActive ? "text-brand-500" : "text-neutral-400"}`}>
            <HugeiconsIcon icon={icon} />
            <p className="text-sm">{label}</p>
          </NavLink>

        ))}
      </ul>

    </nav >
  )
}

export default MobileNav
