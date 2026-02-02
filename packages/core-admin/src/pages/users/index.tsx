import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"
import { UserListTable } from "./_components/user-list-table"

export const Component = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("user.list.after"),
        before: getWidgets("user.list.before"),
      }}
    >
      <UserListTable />
    </SingleColumnPage>
  )
}
