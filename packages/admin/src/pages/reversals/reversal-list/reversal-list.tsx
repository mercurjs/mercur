import { Children, ReactNode } from "react"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import { TransferListDataTable } from "../../transfers/transfer-list/transfer-list"

export const ReversalListTitle = () => {
  const { t } = useTranslation()

  return (
    <div>
      <Heading data-testid="reversal-list-heading">
        {t("reversals.domain")}
      </Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("reversals.subtitle")}
      </Text>
    </div>
  )
}

export const ReversalListActions = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex items-center gap-x-2">
      {Children.count(children) > 0 ? children : null}
    </div>
  )
}

export const ReversalListHeader = ({ children }: { children?: ReactNode }) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="reversal-list-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ReversalListTitle />
          <ReversalListActions />
        </>
      )}
    </div>
  )
}

export const ReversalListDataTable = () => <TransferListDataTable reversals />

export const ReversalListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0" data-testid="reversal-list-container">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ReversalListHeader />
          <ReversalListDataTable />
        </>
      )}
    </Container>
  )
}

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="reversals.list">
        {Children.count(children) > 0 ? children : <ReversalListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const ReversalListPage = Object.assign(Root, {
  Table: ReversalListTable,
  Header: ReversalListHeader,
  HeaderTitle: ReversalListTitle,
  HeaderActions: ReversalListActions,
  DataTable: ReversalListDataTable,
})
