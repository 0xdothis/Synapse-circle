import React from "react"

interface LocationProps {
    lat: number;
    lng: number;
}

function useLocation() {
    const [location, setLocation] = React.useState<LocationProps | null>(null)
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = React.useState('prompt');

    React.useEffect(() => {
        if (!navigator.permissions) return;

        navigator.permissions
            .query({ name: 'geolocation' })
            .then((status) => {
                setPermissionStatus(status.state);

                // Listen for changes (e.g., if the user revokes permission in browser settings)
                status.onchange = () => {
                    setPermissionStatus(status.state);
                };
            })
            .catch((err) => console.error("Error checking permissions:", err));
    }, [])

    const getLocation = React.useCallback(() => {

        if (!navigator.geolocation) {
            alert("your browser do not support location");
            return;
        }

        setLoading(true);
        setError(null)

        navigator.geolocation.getCurrentPosition(position => {
            setLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });
            setLoading(false)

        }, err => {
            setLoading(false);
            switch (err.code) {
                case err.PERMISSION_DENIED:
                    setError('Permission denied. Please enable location access in your browser settings.');
                    break;
                case err.POSITION_UNAVAILABLE:
                    setError('Location information is unavailable.');
                    break;
                case err.TIMEOUT:
                    setError('The request to get user location timed out.');
                    break;
                default:
                    setError('An unknown error occurred.');
                    break;
            }

        })

    }, [])

    return { location, error, loading, getLocation, permissionStatus }
}

export default useLocation
