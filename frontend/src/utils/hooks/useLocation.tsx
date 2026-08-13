// utils/hooks/useLocation.ts
import React from "react"

interface LocationProps {
    lat: number
    lng: number
}

function useLocation() {
    const [location, setLocation] = React.useState<LocationProps | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [permissionStatus, setPermissionStatus] = React.useState("prompt")

    React.useEffect(() => {
        if (!navigator.permissions) return
        navigator.permissions
            .query({ name: "geolocation" })
            .then((status) => {
                setPermissionStatus(status.state)
                status.onchange = () => {
                    setPermissionStatus(status.state)
                }
            })
            .catch((err) => console.error("Error checking permissions:", err))
    }, [])

    const getLocation = React.useCallback((): Promise<LocationProps | null> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                alert("your browser do not support location")
                resolve(null)
                return
            }

            setLoading(true)
            setError(null)

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    }
                    setLocation(coords)
                    setLoading(false)
                    resolve(coords) // ← resolves with the fresh coords, not stale state
                },
                (err) => {
                    setLoading(false)
                    let message: string
                    switch (err.code) {
                        case err.PERMISSION_DENIED:
                            message = "Permission denied. Please enable location access in your browser settings."
                            break
                        case err.POSITION_UNAVAILABLE:
                            message = "Location information is unavailable."
                            break
                        case err.TIMEOUT:
                            message = "The request to get user location timed out."
                            break
                        default:
                            message = "An unknown error occurred."
                    }
                    setError(message)
                    resolve(null)
                }
            )
        })
    }, [])

    return { location, error, loading, getLocation, permissionStatus }
}

export default useLocation
