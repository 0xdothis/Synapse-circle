// src/components/MixpanelProvider.tsx
import { useEffect } from "react"
import { createBrowserRouter } from "react-router"
import { initMixpanel, trackPageView } from "@/lib/mixpanelClient"

type Router = ReturnType<typeof createBrowserRouter>

export default function MixpanelProvider({
  children,
  router,
}: {
  children: React.ReactNode
  router: Router
}) {
  useEffect(() => {
    initMixpanel()
    trackPageView(router.state.location.pathname + router.state.location.search)

    const unsubscribe = router.subscribe((state) => {
      trackPageView(state.location.pathname + state.location.search)
    })

    return () => unsubscribe()
  }, [router])

  return <>{children}</>
}
