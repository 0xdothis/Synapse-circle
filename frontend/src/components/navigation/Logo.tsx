import safewalk from "../../assets/safewalk_light.png"

function Logo() {
  return (
    <div className="h-8">

      <a className="flex h-full items-center gap-4" href="/">
        <img src={safewalk} alt="safewalk shield" className="h-full" />
        <h1 className="text-primary font-black text-xl">SafeWalk Campus </h1>
      </a>
    </div>
  )
}
export default Logo
