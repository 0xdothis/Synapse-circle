import { FullSpinner } from "@/components/Loader";
import { alertDetail } from "@/utils/safewalkFn";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "react-router"


function AlertDetail() {

  const { id } = useParams()

  const { data, isPending } = useSuspenseQuery({
    queryKey: ["alert", id],
    queryFn: () => alertDetail(id!)
  })


  if (isPending) {
    return <FullSpinner />
  }

  console.log(data)



  return (
    <div>Welcome to alert Details</div>
  )
}

export default AlertDetail;
