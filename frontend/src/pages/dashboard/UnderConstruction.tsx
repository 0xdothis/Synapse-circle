import emoji from "../../assets/1F92A.svg"
function underConstruction() {

  return (
    <section className="min-h-screen flex-1 flex flex-col justify-center items-center p-8">
      <div className="flex flex-col justify-center items-center">
        <div className="">
          <img src={emoji} alt="emoji winking" className="w-full h-full" />
        </div>
        <h2 className="bg-primary text-white text-2xl lg:3xl w-fit p-4 font-bold animate-pulse rounded-lg text-center">Dashboard Page is UNDERCONSTRUCTION</h2>
      </div>
    </section>

  )
}

export default underConstruction
