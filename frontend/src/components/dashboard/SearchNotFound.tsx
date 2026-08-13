import Button from "@/components/ui/button";
import { SearchRemoveIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type SearchProps = {
  title: string;
  description: string;
  clear: () => void;
}

function SearchNotFound({ title, description, clear }: SearchProps) {

  return (
    <div className="text-center flex flex-col items-center space-y-4 px-4 py-10">
      <div className="size-30 flex justify-center items-center bg-neutral-100 rounded-full text-neutral-500">
        <HugeiconsIcon icon={SearchRemoveIcon} size={40} />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-neutral-900 font-bold">{title}</h3>
        <p className="text-sm text-neutral-700">{description}</p>
      </div>

      <Button variant="outline" size="sm" className="w-60" onClick={clear}>Clear Search</Button>
    </div>
  )
}


export default SearchNotFound
