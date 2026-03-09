import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Container,
  Heading,
  StatusBadge,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui";

import { SingleColumnPage } from "@mercurjs/dashboard-shared";
import {
  useRequest,
  useAcceptRequest,
  useRejectRequest,
} from "../../../../hooks/api/requests";

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

const TYPE_LABELS: Record<string, string> = {
  product_category: "Category",
  product_collection: "Collection",
  product_tag: "Tag",
  product_type: "Type",
};

const ENTITY_FIELDS: Record<string, { key: string; label: string }[]> = {
  product_category: [
    { key: "name", label: "Name" },
    { key: "handle", label: "Handle" },
    { key: "description", label: "Description" },
    { key: "is_active", label: "Active" },
    { key: "is_internal", label: "Internal" },
  ],
  product_collection: [
    { key: "title", label: "Title" },
    { key: "handle", label: "Handle" },
  ],
  product_tag: [{ key: "value", label: "Value" }],
  product_type: [{ key: "value", label: "Value" }],
};

const ENTITY_NAME_KEY: Record<string, string> = {
  product_category: "name",
  product_collection: "title",
  product_tag: "value",
  product_type: "value",
};

const formatFieldValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

const RequestDetailPage = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const { t } = useTranslation();
  const prompt = usePrompt();

  const { request, isLoading, isError, error } = useRequest(type!, id!);

  const { mutateAsync: acceptRequest, isPending: isAccepting } =
    useAcceptRequest(type!, id!);

  const { mutateAsync: rejectRequest, isPending: isRejecting } =
    useRejectRequest(type!, id!);

  if (isLoading || !request) {
    return (
      <SingleColumnPage>
        <Container className="animate-pulse p-6">
          <div className="h-6 w-48 rounded bg-gray-200" />
        </Container>
      </SingleColumnPage>
    );
  }

  if (isError) throw error;

  const customFields = request.custom_fields as Record<string, any>;
  const status = customFields?.request_status ?? "draft";
  const isPending = status === "pending";
  const entityFields = ENTITY_FIELDS[type!] ?? [];
  const typeLabel = TYPE_LABELS[type!] ?? type;
  const nameKey = ENTITY_NAME_KEY[type!] ?? "name";
  const entityName = (request as Record<string, any>)[nameKey] ?? request.id;

  const handleAccept = async () => {
    const res = await prompt({
      title: "Accept request",
      description:
        "Are you sure you want to accept this request? This action will create the entity.",
      verificationText: entityName,
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    });

    if (!res) return;

    await acceptRequest(
      {},
      {
        onSuccess: () => {
          toast.success("Request accepted");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleReject = async () => {
    const res = await prompt({
      title: "Reject request",
      description:
        "Are you sure you want to reject this request? This action cannot be undone.",
      verificationText: entityName,
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    });

    if (!res) return;

    await rejectRequest(
      {},
      {
        onSuccess: () => {
          toast.success("Request rejected");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <SingleColumnPage hasOutlet={false}>
      {/* Header */}
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-x-4">
            <Heading>{entityName}</Heading>
            <StatusBadge color={statusColor(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </StatusBadge>
            <Badge size="2xsmall" color="grey">
              {typeLabel}
            </Badge>
          </div>
          {isPending && (
            <div className="flex items-center gap-x-2">
              <Button
                variant="secondary"
                size="small"
                onClick={handleReject}
                disabled={isAccepting || isRejecting}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={handleAccept}
                disabled={isAccepting || isRejecting}
              >
                Accept
              </Button>
            </div>
          )}
        </div>
      </Container>

      {/* Details */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Details</Heading>
        </div>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          {entityFields.map(({ key, label }) => {
            const value = (request as Record<string, any>)[key];
            if (value === undefined) return null;
            return (
              <div key={key} className="grid grid-cols-subgrid col-span-2 items-center py-2">
                <Text size="small" leading="compact" weight="plus">
                  {label}
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  {formatFieldValue(key, value)}
                </Text>
              </div>
            );
          })}
          <div className="grid grid-cols-subgrid col-span-2 items-center py-2">
            <Text size="small" leading="compact" weight="plus">
              ID
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              {request.id}
            </Text>
          </div>
          <div className="grid grid-cols-subgrid col-span-2 items-center py-2">
            <Text size="small" leading="compact" weight="plus">
              Created
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              {new Date(request.created_at as string).toLocaleString()}
            </Text>
          </div>
          <div className="grid grid-cols-subgrid col-span-2 items-center py-2">
            <Text size="small" leading="compact" weight="plus">
              Updated
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              {new Date(request.updated_at as string).toLocaleString()}
            </Text>
          </div>
        </div>
      </Container>

      {/* Review Info */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Review</Heading>
        </div>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <div className="grid grid-cols-subgrid col-span-2 items-center py-2">
            <Text size="small" leading="compact" weight="plus">
              Submitter
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              {customFields?.submitter_id ?? "—"}
            </Text>
          </div>
          <div className="grid grid-cols-subgrid col-span-2 items-center py-2">
            <Text size="small" leading="compact" weight="plus">
              Reviewer
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              {customFields?.reviewer_id ?? "—"}
            </Text>
          </div>
          {customFields?.reviewer_note && (
            <div className="grid grid-cols-subgrid col-span-2 items-center py-2">
              <Text size="small" leading="compact" weight="plus">
                Note
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                {customFields.reviewer_note}
              </Text>
            </div>
          )}
        </div>
      </Container>
    </SingleColumnPage>
  );
};

export default RequestDetailPage;
