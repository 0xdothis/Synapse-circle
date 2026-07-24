import React from "react"
import Logo from "./Logo";
import MobileNav from "./MobileNav";
import DesktopNav from "./DesktopNav";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";


function NavBar() {

  const [isOpen, setIsOpen] = React.useState(false);
  const [_, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className="fixed inset-x-0 py-4 top-0 z-50 transition-all duration-300 bg-linear-to-b from-brand-100 to-neutral-50">
      <div className="max-w-360 px-4 flex mx-auto justify-between items-center">
        <Logo />
        <DesktopNav />

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-neutral-600 transition-colors duration-200 hover:text-neutral-900 lg:hidden"
        >
          {isOpen ? (
            <HugeiconsIcon icon={Cancel01Icon} />
          ) : (
            <HugeiconsIcon icon={Menu01Icon} />
          )}
        </button>
      </div>
      <MobileNav isOpen={isOpen} onClose={closeMenu} />
    </header>
  )
}

export default NavBar
