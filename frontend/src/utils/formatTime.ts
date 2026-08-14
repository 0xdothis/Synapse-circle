

export  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    const paddedmins = String(mins).padStart(2, "0");
    const paddedSecs = String(secs).padStart(2, "0")

    return `${paddedmins}:${paddedSecs}`
  }

export const timeData = (timestamp: string): string => {
    const value= new Date(timestamp)

    const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true

    } as const

    const formatted = value.toLocaleString("en-GB", options).replace("at", "—").replace(/(am|pm)$/i, match => match.toUpperCase());

    return formatted
}
