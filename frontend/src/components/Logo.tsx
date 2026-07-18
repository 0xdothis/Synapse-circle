import safewalk from "../assets/safewalk-light.svg"

function Logo() {
  return (
    <div className="flex gap-4 items-center">
      <img src={safewalk} className=" h-full" />
      <h1 className="text-primary font-black text-xl">SafeWalk Campus </h1>
    </div>
  )
}
export default Logo
