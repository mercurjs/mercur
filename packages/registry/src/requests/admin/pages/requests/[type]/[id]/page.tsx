import { useParams } from "react-router-dom";
import { Container, Heading, StatusBadge, Text, usePrompt } from "@medusajs/ui";
import {
  SingleColumnPageSkeleton,
  SingleColumnPage,
  ActionMenu,
} from "@mercurjs/dashboard-shared";
import { CheckCircleSolid, XCircleSolid } from "@medusajs/icons";
import { useRequest, useAcceptRequest, useRejectRequest, RequestDTO } from "../../../../hooks/api/requests";

const statusColor = (status: string) => {
  switch (status) {
    case "accepted":
      return "green" as const;
    case "pending":
      return "orange" as const;
    case "rejected":
      return "red" as const;
    default:
      return "grey" as const;
  }
};

const RequestGeneralSection = ({
  request,
  type,
}: {
  request: RequestDTO;
  type: string;
}) => {
  const prompt = usePrompt();
  const { mutateAsync: acceptRequest } = useAcceptRequest(type, request.id);
  const { mutateAsync: rejectRequest } = useRejectRequest(type, request.id);

  const customFields = request.custom_fields as any;
  const status = customFields?.request_status ?? "draft";
  const isPending = status === "pending";

  const handleAccept = async () => {
    const confirmed = await prompt({
      title: "Accept Request",
      description: "Are you sure you want to accept this request?",
    });
    if (confirmed) {
      await acceptRequest({});
    }
  };

  const handleReject = async () => {
    const confirmed = await prompt({
      title: "Reject Request",
      description: "Are you sure you want to reject this request?",
    });
    if (confirmed) {
      await rejectRequest({});
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{request.id}</Heading>
        <div className="flex items-center gap-x-2">
          <StatusBadge color={statusColor(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </StatusBadge>
          {isPending && (
            <ActionMenu
              groups={[
                {
                  actions: [
                    {
                      label: "Accept",
                      icon: <CheckCircleSolid />,
                      onClick: handleAccept,
                    },
                    {
                      label: "Reject",
                      icon: <XCircleSolid />,
                      onClick: handleReject,
                    },
                  ],
                },
              ]}
            />
          )}
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Type
        </Text>
        <Text size="small" leading="compact">
          {type}
        </Text>
      </div>
      {customFields?.submitter_id && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            Submitter ID
          </Text>
          <Text size="small" leading="compact">
            {customFields.submitter_id}
          </Text>
        </div>
      )}
      {customFields?.reviewer_id && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            Reviewer ID
          </Text>
          <Text size="small" leading="compact">
            {customFields.reviewer_id}
          </Text>
        </div>
      )}
      {customFields?.reviewer_note && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            Reviewer Note
          </Text>
          <Text size="small" leading="compact">
            {customFields.reviewer_note}
          </Text>
        </div>
      )}
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Created At
        </Text>
        <Text size="small" leading="compact">
          {new Date(request.created_at as string).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </div>
    </Container>
  );
};

const RequestDetailPage = () => {
  const { type, id } = useParams();

  const { request, isLoading, isError, error } = useRequest(type!, id!);

  if (isLoading || !request) {
    return <SingleColumnPageSkeleton sections={1} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <SingleColumnPage>
      <RequestGeneralSection request={request} type={type!} />
    </SingleColumnPage>
  );
};

export default RequestDetailPage;
