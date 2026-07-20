import { Outlet } from "react-router";


function RootLayout() {
  return (

    <section className="max-w-5xl m-auto font-sans bg-neutral-50 min-h-screen flex flex-col">

      <section className="px-4 h-full flex flex-col flex-1">
        <Outlet />
      </section>
    </section>
  )
}

export default RootLayout;
