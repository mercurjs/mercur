import { createColumnHelper } from "@tanstack/react-table"

import { AdminCampaign } from "@medusajs/types"
import { StatusBadge } from "@medusajs/ui"
import { SellerDTO } from "@mercurjs/types"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { DateCell } from "../../../components/table/table-cells/common/date-cell"
import {
  TextCell,
  TextHeader,
} from "../../../components/table/table-cells/common/text-cell"
import {
  DescriptionCell,
  DescriptionHeader,
} from "../../../components/table/table-cells/sales-channel/description-cell"
import {
  NameCell,
  NameHeader,
} from "../../../components/table/table-cells/sales-channel/name-cell"
import {
  campaignStatus,
  statusColor,
} from "../../../pages/campaigns/common/utils/campaign-status"

const columnHelper = createColumnHelper<AdminCampaign>()

export const useCampaignTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => <NameHeader />,
        cell: ({ getValue }) => <NameCell name={getValue()} />,
      }),
      columnHelper.accessor("description", {
        header: () => <DescriptionHeader />,
        cell: ({ getValue }) => <DescriptionCell description={getValue()} />,
      }),
      columnHelper.accessor("campaign_identifier", {
        header: () => <TextHeader text={t("campaigns.fields.identifier")} />,
        cell: ({ getValue }) => {
          const value = getValue()
          return <TextCell text={value} />
        },
      }),
      columnHelper.display({
        id: "type",
        header: () => <TextHeader text={t("campaigns.fields.type")} />,
        cell: ({ row }) => {
          const type = row.original.budget?.type

          if (!type) {
            return <TextCell text="-" />
          }

          return <TextCell text={t(`campaigns.budget.type.${type}.title`)} />
        },
      }),
      columnHelper.display({
        id: "owner",
        header: () => <TextHeader text={t("campaigns.fields.owner")} />,
        cell: ({ row }) => {
          const campaign = row.original as AdminCampaign & {
            seller?: Pick<SellerDTO, "name"> | null
          }

          return (
            <TextCell
              text={
                campaign.seller?.name ?? t("campaigns.fields.platformOwner")
              }
            />
          )
        },
      }),
      columnHelper.accessor("starts_at", {
        header: () => <TextHeader text={t("campaigns.fields.start_date")} />,
        cell: ({ getValue }) => {
          const value = getValue()

          if (!value) {
            return
          }

          const date = new Date(value)

          return <DateCell date={date} />
        },
      }),
      columnHelper.accessor("ends_at", {
        header: () => <TextHeader text={t("campaigns.fields.end_date")} />,
        cell: ({ getValue }) => {
          const value = getValue()

          if (!value) {
            return
          }

          const date = new Date(value)

          return <DateCell date={date} />
        },
      }),
      columnHelper.display({
        id: "status",
        header: () => <TextHeader text={t("fields.status")} />,
        cell: ({ row }) => {
          const status = campaignStatus(row.original)

          return (
            <StatusBadge color={statusColor(status)}>
              {t(`campaigns.status.${status}`)}
            </StatusBadge>
          )
        },
      }),
    ],
    [t]
  )
}
