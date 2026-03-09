import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Avatar,
  Badge,
  Button,
  Container,
  Heading,
  StatusBadge,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui";
import { TriangleRightMini } from "@medusajs/icons";

import { SingleColumnPage } from "@mercurjs/dashboard-shared";
import {
  useRequest,
  useAcceptRequest,
  useRejectRequest,
} from "../../../../hooks/api/requests";
import { client } from "../../../../lib/client";

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

const useSeller = (id?: string | null) => {
  const { data, ...rest } = useQuery({
    queryKey: ["seller", id],
    queryFn: () => client.admin.sellers.$id.query({ $id: id! }),
    enabled: !!id,
  });

  return { seller: (data as any)?.seller, ...rest };
};

const useUser = (id?: string | null) => {
  const { data, ...rest } = useQuery({
    queryKey: ["user", id],
    queryFn: () => client.admin.users.$id.query({ $id: id! }),
    enabled: !!id,
  });

  return { user: (data as any)?.user, ...rest };
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

  const customFields = (request?.custom_fields ?? {}) as Record<string, any>;

  const { seller } = useSeller(customFields?.submitter_id);
  const { user } = useUser(customFields?.reviewer_id);

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
        <div className="flex flex-col gap-y-3 px-6 py-4">
          {entityFields.map(({ key, label }) => {
            const value = (request as Record<string, any>)[key];
            if (value === undefined) return null;
            return (
              <div key={key} className="grid grid-cols-2">
                <Text size="small" leading="compact" weight="plus">
                  {label}
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  {formatFieldValue(key, value)}
                </Text>
              </div>
            );
          })}
          <div className="grid grid-cols-2">
            <Text size="small" leading="compact" weight="plus">
              Created
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              {new Date(request.created_at as string).toLocaleString()}
            </Text>
          </div>
          <div className="grid grid-cols-2">
            <Text size="small" leading="compact" weight="plus">
              Updated
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              {new Date(request.updated_at as string).toLocaleString()}
            </Text>
          </div>
        </div>
      </Container>

      {/* Submitter (Seller) */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Submitter</Heading>
        </div>
        <div className="px-6 py-4">
          {seller ? (
            <Link
              to={`/sellers/${seller.id}`}
              className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
            >
              <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-3 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={seller.logo ?? undefined}
                    fallback={seller.name?.charAt(0).toUpperCase() ?? "S"}
                  />
                  <div className="flex flex-1 flex-col">
                    <span className="text-ui-fg-base txt-small font-medium">
                      {seller.name}
                    </span>
                  </div>
                  <div className="size-7 flex items-center justify-center">
                    <TriangleRightMini className="text-ui-fg-muted" />
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <Text size="small" className="text-ui-fg-muted">
              {customFields?.submitter_id ?? "—"}
            </Text>
          )}
        </div>
      </Container>

      {/* Reviewer (User) */}
      {(customFields?.reviewer_id || customFields?.reviewer_note) && (
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Reviewer</Heading>
          </div>
          <div className="px-6 py-4">
            {user ? (
              <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    fallback={
                      (user.first_name ?? user.email ?? "U")
                        .charAt(0)
                        .toUpperCase()
                    }
                  />
                  <div className="flex flex-1 flex-col">
                    <span className="text-ui-fg-base txt-small font-medium">
                      {[user.first_name, user.last_name]
                        .filter(Boolean)
                        .join(" ") || user.email}
                    </span>
                    {user.first_name && user.email && (
                      <span className="text-ui-fg-muted text-xs">
                        {user.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : customFields?.reviewer_id ? (
              <Text size="small" className="text-ui-fg-muted">
                {customFields.reviewer_id}
              </Text>
            ) : null}
          </div>
          {customFields?.reviewer_note && (
            <div className="px-6 py-4">
              <Text size="small" leading="compact" weight="plus" className="mb-1">
                Note
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                {customFields.reviewer_note}
              </Text>
            </div>
          )}
        </Container>
      )}
    </SingleColumnPage>
  );
};

export default RequestDetailPage;
