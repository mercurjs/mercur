import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, remoteQueryObjectFromString } from "@medusajs/framework/utils"

import { AdminGetReservationsParamsType } from "./validators"
import { filterReservationsBySeller, ReservationFilters } from "./utils"

export const GET = async (
    req: AuthenticatedMedusaRequest<AdminGetReservationsParamsType>,
    res: MedusaResponse
) => {
    const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

    const skip = req.queryConfig.pagination?.skip ?? 0
    const take = req.queryConfig.pagination?.take ?? 20

    const { reservationIds, count } = await filterReservationsBySeller(
        req.scope,
        skip,
        take,
        req.filterableFields as ReservationFilters
    )

    if (reservationIds.length === 0) {
        return res.status(200).json({
            reservations: [],
            count: 0,
            offset: skip,
            limit: take,
        })
    }

    const query = remoteQueryObjectFromString({
        entryPoint: "reservations",
        variables: {
            filters: {
                id: reservationIds
            }
        },
        fields: req.queryConfig.fields,
    })

    const reservations = await remoteQuery({
        ...query,
    })


    res.status(200).json({
        reservations,
        count,
        offset: skip,
        limit: take,
    })
}

