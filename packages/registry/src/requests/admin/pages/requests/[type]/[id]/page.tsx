import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Container,
  Heading,
  StatusBadge,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui";
import { ArrowUturnLeft } from "@medusajs/icons";
import { useState } from "react";

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

const formatFieldValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

const RequestDetailPage = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [reviewerNote, setReviewerNote] = useState("");

  const { request, isLoading, isError, error } = useRequest(type!, id!);

  const { mutateAsync: acceptRequest, isPending: isAccepting } =
    useAcceptRequest(type!, id!);

  const { mutateAsync: rejectRequest, isPending: isRejecting } =
    useRejectRequest(type!, id!);

  const handleAccept = async () => {
    await acceptRequest(
      { reviewer_note: reviewerNote || undefined },
      {
        onSuccess: () => {
          toast.success("Request accepted");
          setReviewerNote("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleReject = async () => {
    await rejectRequest(
      { reviewer_note: reviewerNote || undefined },
      {
        onSuccess: () => {
          toast.success("Request rejected");
          setReviewerNote("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

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

  return (
    <SingleColumnPage hasOutlet={false}>
      {/* General Info */}
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-x-3">
            <Heading>{typeLabel} Request</Heading>
            <StatusBadge color={statusColor(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </StatusBadge>
          </div>
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate(-1)}
          >
            <ArrowUturnLeft />
            {t("actions.back")}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-y-3 px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            ID
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {request.id}
          </Text>

          {entityFields.map(({ key, label }) => {
            const value = (request as Record<string, any>)[key];
            if (value === undefined) return null;
            return (
              <div key={key} className="col-span-2 grid grid-cols-2">
                <Text size="small" leading="compact" weight="plus">
                  {label}
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  {formatFieldValue(key, value)}
                </Text>
              </div>
            );
          })}

          <Text size="small" leading="compact" weight="plus">
            Created At
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {new Date(request.created_at as string).toLocaleString()}
          </Text>

          <Text size="small" leading="compact" weight="plus">
            Updated At
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {new Date(request.updated_at as string).toLocaleString()}
          </Text>
        </div>
      </Container>

      {/* Submitter & Reviewer Info */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Review Details</Heading>
        </div>
        <div className="grid grid-cols-2 gap-y-3 px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            Submitter ID
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {customFields?.submitter_id ?? "—"}
          </Text>

          <Text size="small" leading="compact" weight="plus">
            Reviewer ID
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {customFields?.reviewer_id ?? "—"}
          </Text>

          <Text size="small" leading="compact" weight="plus">
            Reviewer Note
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {customFields?.reviewer_note ?? "—"}
          </Text>
        </div>
      </Container>

      {/* Review Actions */}
      {isPending && (
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Review Actions</Heading>
          </div>
          <div className="flex flex-col gap-y-4 px-6 py-4">
            <div>
              <Text size="small" weight="plus" className="mb-2">
                Reviewer Note (optional)
              </Text>
              <Textarea
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                placeholder="Add a note for the submitter..."
              />
            </div>
            <div className="flex items-center gap-x-2">
              <Button
                variant="primary"
                size="small"
                onClick={handleAccept}
                isLoading={isAccepting}
                disabled={isRejecting}
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={handleReject}
                isLoading={isRejecting}
                disabled={isAccepting}
              >
                Reject
              </Button>
            </div>
          </div>
        </Container>
      )}
    </SingleColumnPage>
  );
};

export default RequestDetailPage;
