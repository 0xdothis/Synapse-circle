


function Loader({ heading, description }: { heading?: string; description?: string }) {

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <div className="relative w-[45px] h-[45px] animate-spin [animation-duration:2500ms]">

        <div className="absolute top-0 left-[20px] w-[5px] h-[10px] bg-[#0D7377] rounded-full origin-[2.5px_22.5px]"></div>

        <div className="absolute top-0 left-[20px] w-[5px] h-[10px] bg-[#0D7377] rounded-full origin-[2.5px_22.5px] rotate-[45deg]"></div>

        <div className="absolute top-0 left-[20px] w-[5px] h-[10px] bg-[#0D7377] rounded-full origin-[2.5px_22.5px] rotate-[90deg]"></div>

        <div className="absolute top-0 left-[20px] w-[5px] h-[10px] bg-[#0D7377] rounded-full origin-[2.5px_22.5px] rotate-[135deg]"></div>

        <div className="absolute top-0 left-[20px] w-[5px] h-[10px] bg-[#0D7377] rounded-full origin-[2.5px_22.5px] rotate-[180deg]"></div>

        <div className="absolute top-0 left-[20px] w-[5px] h-[10px] bg-[#0D7377] rounded-full origin-[2.5px_22.5px] rotate-[225deg]"></div>

        <div className="absolute top-0 left-[20px] w-[5px] h-[10px] bg-[#0D7377] rounded-full origin-[2.5px_22.5px] rotate-[270deg]"></div>
        <div className="absolute top-0 left-[20px] w-[5px] h-[10px] bg-[#0D7377] rounded-full origin-[2.5px_22.5px] rotate-[315deg]"></div>
      </div>
      {heading && <h3 className="text-2xl text-neutral-900 font-bold text-center">{heading}</h3>}
      {description && <p className="text-neutral-700">{description}</p>}

    </div>
  )
}

export default Loader;
