import { useParams } from "react-router-dom";
import { ExclamationCircle, Spinner } from "@medusajs/icons";

import { Container, Heading, Text } from "@medusajs/ui";
import { useAdminUser } from "medusa-react";
import moment from "moment";

import BackButton from "../../../../components/atoms/back-button";

const UserEdit = () => {
  const { id } = useParams();

  const { user, isLoading, isError } = useAdminUser(id!);

  if (isLoading) {
    return (
      <Container className="flex min-h-[320px] items-center justify-center">
        <Spinner className="text-ui-fg-subtle animate-spin" />
      </Container>
    );
  }

  if (isError || !user) {
    return (
      <Container className="flex min-h-[320px] items-center justify-center">
        <div className="flex items-center gap-x-2">
          <ExclamationCircle className="text-ui-fg-base" />
          <Text className="text-ui-fg-subtle">
            Error occured while loading user. Reload the page and try again. If
            the issue persists, try again later.
          </Text>
        </div>
      </Container>
    );
  }

  const fullName =
    user.first_name || user.last_name
      ? `${user.first_name ?? "-"} ${user.last_name ?? "-"}`
      : null;

  return (
    <div>
      <BackButton
        path="/a/settings/team"
        label="Back to Team"
        className="mb-xsmall"
      />
      <Container>
        <div className="flex flex-col gap-y-1 pb-6">
          <div className="flex items-center justify-between">
            <Heading>User details</Heading>
          </div>
          <Text>{user.email}</Text>
        </div>
        <div className="small:grid-cols-2 medium:grid-cols-3 grid grid-cols-1 gap-6">
          <div className="border-ui-border-base flex flex-col gap-y-1 border-l px-4">
            <Text size="base" className="text-ui-fg-subtle">
              First and last name
            </Text>
            {fullName ? (
              <Text size="large">{fullName}</Text>
            ) : (
              <Text size="large" className="text-ui-fg-muted">
                -
              </Text>
            )}
          </div>
          <div className="border-ui-border-base flex flex-col gap-y-1 border-l px-4">
            <Text size="base" className="text-ui-fg-subtle">
              Created at
            </Text>
            <Text size="large">
              {moment(user.created_at).format("MMM Do YYYY [at] HH:mm a")}
            </Text>
          </div>
          <div className="border-ui-border-base flex flex-col gap-y-1 border-l px-4">
            <Text size="base" className="text-ui-fg-subtle">
              Role
            </Text>
            <Text size="large">{user.role}</Text>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default UserEdit;
