import { LoaderFunctionArgs } from "react-router-dom"
import { getLinkQuery } from "@mercurjs/dashboard-shared"
import { reservationItemsQueryKeys } from "../../../hooks/api/reservations"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const reservationDetailQuery = (id: string) => {
  const query = getLinkQuery("reservation")
  return {
    queryKey: reservationItemsQueryKeys.detail(id, query),
    queryFn: async () => sdk.admin.reservations.$id.query({ $id: id, ...query }),
  }
}

export const reservationItemLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = reservationDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
