import EmptyTemplate from "./EmptyTemplate"

function AlertEmpty() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <EmptyTemplate title="No Alert History" description="Your completed emergency sessions will appear here." CTA="Return Home" />
    </div>
  )
}

export default AlertEmpty
