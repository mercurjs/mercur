import { useUserMe } from "@hooks/api/users";
import { ProfileGeneralSection } from "./_components/profile-general-section";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { SingleColumnPage } from "@components/layout/pages";

const ProfileDetail = () => {
  const { member, isPending: isLoading, isError, error } = useUserMe();

  if (isLoading || !member) {
    return <SingleColumnPageSkeleton sections={1} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <SingleColumnPage>
      <ProfileGeneralSection user={member} />
    </SingleColumnPage>
  );
};

export const Component = ProfileDetail;
