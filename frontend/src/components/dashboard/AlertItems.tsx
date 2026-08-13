import { Link } from "react-router"
import { type AlertProps } from "./data"
import AlertCard from "./AlertCard"

interface AlertItemsProps {
  data: AlertProps[]
}

function AlertItems({ data }: AlertItemsProps) {

  console.log("[ALERT DATA]", data)
  return (
    <div className="flex flex-col gap-3">
      {data.map(alert => (<Link to={`${alert.id}`} key={`${alert.time}-${alert.duration}`}>
        <AlertCard alertInfo={alert} />
      </Link>))
      }

    </div >
  )
}


export default AlertItems

