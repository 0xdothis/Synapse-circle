import { cn } from "@/utils";

interface HeaderProps {
  title: string;
  caption: string;
  name?: string;
  className?: string;

}

function Header({ title, caption, name, className }: HeaderProps) {
  return (
    <div className="flex flex-row justify-between items-center sticky bg-neutral-50 w-full p-4 top-0 z-50">
      <div className={cn("flex flex-col", className)}>
        {caption && <p className="font-medium text-neutral-700">{caption} {name}</p>}
        <h2 className="text-neutral-900 font-bold text-2xl">{title}</h2>
      </div>
      <div className="size-10 bg-brand-200 rounded-full" />
    </div>
  )
}

export default Header
