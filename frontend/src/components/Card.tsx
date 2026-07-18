import CardItem from "./CardItem";
import { type dataType } from "../data";
import { cn } from "@/utils"

type ClassnameType = {
  className?: string;
  data: dataType[];

}

function Card({ data, className }: ClassnameType) {

  return (
    <div className={cn("space-y-4", className)}>
      {data?.map(({ icon, title, description }, index) => <CardItem key={index} children={icon} title={title} description={description} />
      )}
    </div>
  )
}

export default Card
