// src/lib/mixpanelClient.ts
import mixpanel from "mixpanel-browser"

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN

export const initMixpanel = () => {
  if (!MIXPANEL_TOKEN) {
    console.warn("Mixpanel token is missing! Check your .env file.")
    return
  }


  mixpanel.init(MIXPANEL_TOKEN, {
    debug: import.meta.env.DEV,
    autocapture: true,
    persistence: "localStorage",
    api_host: "https://api-eu.mixpanel.com"
  })

}

export const trackPageView = (url: string) => {
  mixpanel.track("Page View", { url })
}


// New: general-purpose event tracking
export const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  mixpanel.track(event, properties)
}

// New: identify a user after login/signup
export const identifyUser = (userId: string) => {
  mixpanel.identify(userId)
}

// New: attach properties to a user's profile
export const setUserProperties = (properties: Record<string, unknown>) => {
  mixpanel.people.set(properties)
}

// New: call on logout — resets the anonymous ID so future sessions aren't merged with this user
export const resetAnalytics = () => {
  mixpanel.reset()
}
