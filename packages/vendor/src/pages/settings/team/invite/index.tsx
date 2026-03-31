import { RouteFocusModal } from "@components/modals";
import { InviteUserForm } from "./_components/invite-user-form";

export const TeamInvite = () => {
  return (
    <RouteFocusModal>
      <InviteUserForm />
    </RouteFocusModal>
  );
};
