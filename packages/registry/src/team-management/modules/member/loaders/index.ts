import { LoaderOptions } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { MEMBER_MODULE } from "../index"
import MemberModuleService from "../service"

export default async function seedMembersForSellersLoader({
  container,
}: LoaderOptions) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const memberService =
    container.resolve<MemberModuleService>(MEMBER_MODULE)

  try {
    const { data: sellers } = await query.graph({
      entity: "seller",
      fields: ["id", "name", "email"],
    })

    if (!sellers.length) {
      return
    }

    const { data: existingMembers } = await query.graph({
      entity: "member",
      fields: ["seller_id"],
    })

    const sellersWithMembers = new Set(
      existingMembers.map((m) => m.seller_id)
    )

    const sellersWithoutMembers = sellers.filter(
      (s) => !sellersWithMembers.has(s.id)
    )

    if (!sellersWithoutMembers.length) {
      return
    }

    logger.info(
      `[Member Module] Found ${sellersWithoutMembers.length} seller(s) without members. Creating owner members...`
    )

    for (const seller of sellersWithoutMembers) {
      await memberService.createMembers({
        name: seller.name,
        email: seller.email,
        role: "owner",
        seller_id: seller.id,
      })

      logger.info(
        `[Member Module] Created owner member for seller "${seller.name}" (${seller.id})`
      )
    }
  } catch (error) {
    logger.error(`[Member Module] Failed to seed members:`)
    console.error(error)
  }
}
