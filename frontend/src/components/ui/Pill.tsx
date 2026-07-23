type PillType = {
  text: string;
}

function Pill({ text }: PillType) {
  return (
    <div className="bg-brand-100 rounded-full px-4 py-2 flex items-center gap-2 w-fit ">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
      </span>
      <p className="text-primary font-semibold text-sm lg:text-base lg:font-medium">{text}</p>
    </div>
  )
}

export default Pill
