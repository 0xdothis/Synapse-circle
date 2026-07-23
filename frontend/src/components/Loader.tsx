import { cn } from "@/utils";

const sizeMap = {
  sm: {
    container: "w-4 h-4",       // 16px
    dot: "w-0.5 h-1",           // ~2px x 4px
    offset: "left-1.5 top-0",
    origin: "origin-[1px_8px]", // half-width, half-height of container
  },
  md: {
    container: "w-6 h-6",       // 24px — good for default buttons
    dot: "w-0.75 h-1.5",
    offset: "left-2.5 top-0",
    origin: "origin-[1.5px_12px]",
  },
  lg: {
    container: "w-11.25 h-11.25", // your original
    dot: "w-1.25 h-2.5",
    offset: "left-5 top-0",
    origin: "origin-[2.5px_22.5px]",
  },
};


function Loader({ heading, description }: { heading?: string; description?: string }) {

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <Spinner />
      {heading && <h3 className="text-2xl text-neutral-900 font-bold text-center">{heading}</h3>}
      {description && <p className="text-neutral-700">{description}</p>}

    </div>
  )
}


export function Spinner({ size = "lg", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const s = sizeMap[size];
  const rotations = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <div className={cn("relative animate-spin", s.container)} style={{ animationDuration: "2500ms" }}>
      {rotations.map((deg) => (
        <div
          key={deg}
          className={cn(
            "absolute bg-primary rounded-full",
            s.dot,
            s.offset,
            s.origin,
            className
          )}
          style={{ transform: `rotate(${deg}deg)` }}
        />
      ))}
    </div>
  );
}

export function FullSpinner() {
  return (
    <div className=" min-h-screen bg-neutral-50 top-0 bottom-0 left-0 right-0 z-20 absolute flex flex-col justify-center items-center ">
      <Spinner />
    </div>

  )
}


export default Loader;
