import { RouteFocusModal } from "@components/modals"
import { InviteUserForm } from "./_components/invite-user-form"

const UserInvite = () => {
  return (
    <RouteFocusModal>
      <InviteUserForm />
    </RouteFocusModal>
  )
}

export const Component = UserInvite
