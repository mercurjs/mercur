import { useParams, useNavigate } from "react-router-dom"
import { Container, Heading, Text, usePrompt } from "@medusajs/ui"

import {
  SingleColumnPageSkeleton,
  SingleColumnPage,
  ActionMenu,
} from "@mercurjs/dashboard-shared"
import { useMember, useDeleteMember } from "../../../hooks/api/members"
import type { MemberDTO } from "../../../hooks/api/members"
import { PencilSquare, Trash } from "@medusajs/icons"

const MemberGeneralSection = ({ member }: { member: MemberDTO }) => {
  const navigate = useNavigate()
  const prompt = usePrompt()
  const { mutateAsync: deleteMember } = useDeleteMember(member.id)

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: "Delete team member",
      description: "Are you sure you want to remove this team member?",
      confirmText: "Delete",
      cancelText: "Cancel",
    })

    if (confirmed) {
      await deleteMember()
      navigate("/users", { replace: true })
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{member.email || member.name}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: "Edit",
                  icon: <PencilSquare />,
                  to: `/users/${member.id}/edit`,
                },
              ],
            },
            {
              actions: [
                {
                  label: "Delete",
                  icon: <Trash />,
                  onClick: handleDelete,
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Name
        </Text>
        <Text size="small" leading="compact">
          {member.name || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Role
        </Text>
        <Text size="small" leading="compact">
          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Email
        </Text>
        <Text size="small" leading="compact">
          {member.email || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Phone
        </Text>
        <Text size="small" leading="compact">
          {member.phone || "-"}
        </Text>
      </div>
    </Container>
  )
}

const UserDetailPage = () => {
  const { id } = useParams()

  const { member, isLoading, isError, error } = useMember(id!)

  if (isLoading || !member) {
    return <SingleColumnPageSkeleton sections={1} />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage>
      <MemberGeneralSection member={member} />
    </SingleColumnPage>
  )
}

export default UserDetailPage
