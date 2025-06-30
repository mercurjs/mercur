import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMMISSION_MODULE } from '@mercurjs/commission'
import { CommissionModuleService } from '@mercurjs/commission'

import sellerOrder from '../../../links/seller-order'

type Input = {
  expand: boolean
  pagination: {
    skip: number
    take: number
  }
  filters: {
    start_date?: Date
    end_date?: Date
    seller_id?: string
  }
}

export const listCommissionLinesStep = createStep(
  'list-commission-lines',
  async (input: Input, { container }) => {
    const { pagination, filters } = input
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    const createdFilter: { $gte?: Date; $lte?: Date } = {}
    const itemLineIdFilter: { $in?: string[] } = {}

    if (filters.start_date) {
      createdFilter.$gte = filters.start_date
    }

    if (filters.end_date) {
      createdFilter.$lte = filters.end_date
    }

    if (filters.seller_id) {
      const { data: sellerOrders } = await query.graph({
        entity: sellerOrder.entryPoint,
        fields: ['*', 'order.items.id'],
        filters: {
          seller_id: filters.seller_id,
          created_at: createdFilter
        }
      })

      itemLineIdFilter.$in = sellerOrders
        .flatMap((o) => o.order.items)
        .map((i) => i.id)
    }

    const [commissionLines, count] = await service.listAndCountCommissionLines(
      {
        item_line_id: itemLineIdFilter,
        created_at: createdFilter
      },
      {
        take: pagination.take,
        skip: pagination.skip
      }
    )

    if (input.expand) {
      const itemIds = commissionLines.map((line) => line.item_line_id)

      const ruleIds = commissionLines.map((line) => line.rule_id)

      const { data: rules } = await query.graph({
        entity: 'commission_rule',
        fields: ['*', 'rate.*'],
        filters: {
          id: ruleIds
        },
        withDeleted: true
      })

      const { data: orders } = await query.graph({
        entity: 'order',
        fields: ['*', 'seller.id', 'seller.name', 'items.id'],
        filters: {
          items: {
            id: itemIds
          }
        }
      })

      const expandedLines = commissionLines.map((line) => {
        const order = orders.find((o) =>
          o.items.some((i) => i.id === line.item_line_id)
        )
        const rule = rules.find((r) => r.id === line.rule_id)
        return {
          ...line,
          order,
          rule
        }
      })

      return new StepResponse({ lines: expandedLines, count })
    }

    return new StepResponse({ lines: commissionLines, count })
  }
)
