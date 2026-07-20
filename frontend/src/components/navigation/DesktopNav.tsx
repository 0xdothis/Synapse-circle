import Link from "@/components/ui/Link";
import { navLinks } from "./navLinks";

const DesktopNav = () => {
  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="hidden lg:flex items-center justify-between flex-1">
      {/* Navigation Links */}
      <nav className="mx-auto">
        <ul className="flex items-center gap-10">
          {navLinks.map((link) => (
            <li key={link.label}>
              <button
                onClick={() => scrollToSection(link.sectionId)}
                className="
                  duration-300
            
    
                "
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* CTA Buttons */}
      <div className="flex items-center gap-3">
        <Link
          to="/login"
          variant="ghost"
        >
          Log in
        </Link>

        <Link
          to="/signup"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default DesktopNav;
