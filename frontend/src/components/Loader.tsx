


function Loader({ heading, description }: { heading: string; description: string }) {

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <span className="h-10 w-10 rounded-full bg-primary inline-block"></span>

      <h3 className="text-2xl text-neutral-900 font-bold text-center">{heading}</h3>
      <p className="text-neutral-700">{description}</p>

    </div>
  )
}

export default Loader;
