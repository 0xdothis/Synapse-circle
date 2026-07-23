
import { RouterProvider } from 'react-router'
import { router } from './router'
import MixpanelProvider from './components/MixpanelProvider'



function App() {
  return (
    <main className="font-sans bg-neutral-50 min-h-screen flex flex-col">

      <section className='max-w-360 mx-auto w-full'>
        <MixpanelProvider router={router} >
          <RouterProvider router={router} />
        </MixpanelProvider>
      </section>
    </main >
  )
}

export default App
