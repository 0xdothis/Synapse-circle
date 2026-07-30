import { HugeiconsIcon } from "@hugeicons/react"
import { navLinks } from "./navLinks"
import { Link } from "react-router"

function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 right-0 left-0 w-full z-50 bg-neutral-50 p-4 border-t border-neutral-300">
      <ul className="flex justify-between">
        {navLinks.map(({ sectionId, label, to, icon }) => (
          <Link to={to} key={sectionId} className="text-neutral-400 flex flex-col justify-center items-center space-y-1">
            <HugeiconsIcon icon={icon} />
            <p className="text-sm">{label}</p>
          </Link>

        ))}
      </ul>

    </nav>
  )
}

export default MobileNav
