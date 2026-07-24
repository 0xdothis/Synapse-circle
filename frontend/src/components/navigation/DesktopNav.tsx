import Link from "@/components/ui/Link";
import { navLinks } from "./navLinks";
import React from "react";

const DesktopNav = () => {
  const [activeSection, setActiveSection] = React.useState('home');
  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setActiveSection(id)
    }
  };


  React.useEffect(() => {
    const observers = navLinks.map(link => {
      const el = document.getElementById(link.sectionId);
      if (!el) return null;

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setActiveSection(link.sectionId);
        }
      }, { threshold: 0.6 });

      observer.observe(el);
      return { observer, el };
    });

    return () => {
      observers.forEach(item => item?.observer.unobserve(item.el));
    };
  }, []);

  return (
    <div className="hidden lg:flex items-center justify-between flex-1 lg:text-xl lg:font-medium">

      <nav className="mx-auto">
        <ul className="flex items-center gap-10">
          {navLinks.map((link) => (
            <li key={link.label} className="hover:text-primary">
              <button
                onClick={() => scrollToSection(link.sectionId)}
                className={`duration-300 ${activeSection === link.sectionId
                  ? "text-primary"
                  : "text-neutral-700"
                  }`}>
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* CTA Buttons */}
      <div className="flex items-center gap-3">
        <Link
          to="/auth/login"
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
