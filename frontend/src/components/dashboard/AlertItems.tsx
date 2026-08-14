import { Link } from "react-router"
import AlertCard from "./AlertCard"
import type { AlertSchema } from "@/types"
import React from "react"

interface AlertItemsProps {
  data: AlertSchema[]
}

function AlertItems({ data }: AlertItemsProps) {
  const [clicked, setIsClicked] = React.useState(false)


  return (
    <div className="flex flex-col gap-3">
      {data.map(alert => (<Link to={`${alert.id}`} key={alert.id} aria-disabled={clicked} onClick={(e) => {
        if (clicked) {
          e.preventDefault();
          return
        }
        setIsClicked(true)
      }}>
        <AlertCard alertInfo={alert} />
      </Link>))
      }

    </div >
  )
}


export default AlertItems

