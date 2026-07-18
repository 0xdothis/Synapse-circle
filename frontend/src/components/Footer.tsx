import Logo from "./Logo";



function Footer() {
  return (
    <footer className="px-6 py-4 text-sm text-default space-y-4 border border-t-neutral-200 -mx-4">
      <Logo />
      <p className="">© 2026 SafeWalk Campus. Built for student safety.</p>
      <div className="font-medium  flex gap-6 pt-2 pb-6">
        <a>Privacy</a>
        <a>Terms</a>
        <a>Support</a>

      </div>
    </footer>
  )
}

export default Footer;
