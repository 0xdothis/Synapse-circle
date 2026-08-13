import { Link } from "react-router"
import { type HospitalProps } from "./data"
import DirectoryCard from "./DirectoryCard"

interface DirectoryItemsProps {
  data: HospitalProps[]
}

function DirectoryItems({ data }: DirectoryItemsProps) {
  return (
    <div className="flex flex-col gap-3">
      {data.map(hospital => (<Link to="hospital-details" key={`${hospital.name}-${hospital.tel}`}>
        <DirectoryCard hospitalInfo={hospital} />
      </Link>))}

    </div>
  )
}


export default DirectoryItems
