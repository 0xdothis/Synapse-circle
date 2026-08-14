
import React from "react"
import { getGreeting } from "@/utils/greeting"

function msUntilNextHour(): number {
  const now = new Date()
  const nextHour = new Date(now)
  nextHour.setHours(now.getHours() + 1, 0, 0, 0) 
  return nextHour.getTime() - now.getTime()
}

export function useGreeting() {
  const [greeting, setGreeting] = React.useState(() => getGreeting())

  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    function scheduleNextUpdate() {
      timeoutId = setTimeout(() => {
        setGreeting(getGreeting())
        scheduleNextUpdate()
      }, msUntilNextHour())
    }

    scheduleNextUpdate()

    return () => clearTimeout(timeoutId)
  }, [])

  return greeting
}
