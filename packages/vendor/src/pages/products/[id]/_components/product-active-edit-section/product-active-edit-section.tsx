import { ExclamationCircleSolid } from "@medusajs/icons";
import { Button, Container, Heading, Text, toast, usePrompt } from "@medusajs/ui";
import {
  ProductChangeActionDTO,
  ProductChangeActionType,
  ProductChangeStatus,
} from "@mercurjs/types";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo } from "react";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { Thumbnail } from "@components/common/thumbnail";
import { useCollection } from "@hooks/api/collections";
import { useProductCategory } from "@hooks/api/categories";
import { useCancelProductEdit, useProductChange } from "@hooks/api/products";
import { useProductTag } from "@hooks/api/tags";
import { useProductType } from "@hooks/api/product-types";
import { sdk } from "@lib/client";

type ProductActiveEditSectionProps = {
  productId: string;
};

type FieldDiff = {
  field: string;
  previous: unknown;
  next: unknown;
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return JSON.stringify(value);
};

const isImageList = (value: unknown): value is { url: string }[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      "url" in entry &&
      typeof (entry as { url: unknown }).url === "string"
  );

const ImageStrip = ({
  images,
  faded,
}: {
  images: { url: string }[];
  faded?: boolean;
}) => (
  <div className={faded ? "flex items-center gap-1.5 opacity-50" : "flex items-center gap-1.5"}>
    {images.map((image, idx) => (
      <Thumbnail key={`${image.url}-${idx}`} src={image.url} size="base" />
    ))}
  </div>
);

type ReferenceField =
  | "brand_id"
  | "type_id"
  | "collection_id"
  | "categories"
  | "tags";

const REFERENCE_FIELDS: ReferenceField[] = [
  "brand_id",
  "type_id",
  "collection_id",
  "categories",
  "tags",
];

const isReferenceField = (field: string): field is ReferenceField =>
  (REFERENCE_FIELDS as string[]).includes(field);

const extractIds = (field: ReferenceField, value: unknown): string[] => {
  if (value === null || value === undefined || value === "") return [];

  if (field === "categories" || field === "tags") {
    if (!Array.isArray(value)) return [];
    return value
      .map((entry) =>
        typeof entry === "string"
          ? entry
          : typeof entry === "object" && entry !== null && "id" in entry
            ? String((entry as { id: unknown }).id ?? "")
            : ""
      )
      .filter(Boolean);
  }

  return typeof value === "string" ? [value] : [];
};

const BrandName = ({ id }: { id: string }) => {
  const { data } = useQuery({
    queryKey: ["product_brand", id],
    queryFn: () =>
      sdk.vendor.productBrands.$id.query({ $id: id }) as Promise<{
        product_brand: { name: string };
      }>,
    enabled: !!id,
  });
  return <>{data?.product_brand?.name ?? id}</>;
};

const TypeName = ({ id }: { id: string }) => {
  const { product_type } = useProductType(id);
  return <>{product_type?.value ?? id}</>;
};

const CollectionName = ({ id }: { id: string }) => {
  const { collection } = useCollection(id);
  return <>{collection?.title ?? id}</>;
};

const CategoryName = ({ id }: { id: string }) => {
  const { product_category } = useProductCategory(id);
  return <>{product_category?.name ?? id}</>;
};

const TagName = ({ id }: { id: string }) => {
  const { product_tag } = useProductTag(id);
  return <>{product_tag?.value ?? id}</>;
};

const ReferenceName = ({
  field,
  id,
}: {
  field: ReferenceField;
  id: string;
}) => {
  switch (field) {
    case "brand_id":
      return <BrandName id={id} />;
    case "type_id":
      return <TypeName id={id} />;
    case "collection_id":
      return <CollectionName id={id} />;
    case "categories":
      return <CategoryName id={id} />;
    case "tags":
      return <TagName id={id} />;
  }
};

const ReferenceList = ({
  field,
  ids,
}: {
  field: ReferenceField;
  ids: string[];
}) => {
  if (!ids.length) return <>-</>;
  return (
    <>
      {ids.map((id, idx) => (
        <Fragment key={`${field}-${id}`}>
          {idx > 0 && ", "}
          <ReferenceName field={field} id={id} />
        </Fragment>
      ))}
    </>
  );
};

const FieldRow = ({ diff }: { diff: FieldDiff }) => {
  const { t } = useTranslation();
  const hasPrevious =
    diff.previous !== undefined &&
    diff.previous !== null &&
    diff.previous !== "" &&
    !(Array.isArray(diff.previous) && diff.previous.length === 0);

  const nextIsImages = isImageList(diff.next);
  const previousIsImages = isImageList(diff.previous);
  const renderAsImages = nextIsImages || previousIsImages;
  const renderAsReference = isReferenceField(diff.field);

  return (
    <div className="flex items-start gap-4">
      <Text
        size="small"
        weight="plus"
        leading="compact"
        className="text-ui-fg-subtle w-[160px] shrink-0"
      >
        {t(`fields.${diff.field}`, { defaultValue: diff.field })}
      </Text>

      {renderAsImages ? (
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {hasPrevious && previousIsImages && (
            <ImageStrip images={diff.previous as { url: string }[]} faded />
          )}
          {hasPrevious && (
            <Text
              size="small"
              leading="compact"
              className="text-ui-fg-subtle"
            >
              →
            </Text>
          )}
          {nextIsImages ? (
            <ImageStrip images={diff.next as { url: string }[]} />
          ) : (
            <Text
              size="small"
              leading="compact"
              className="text-ui-fg-subtle"
            >
              {formatValue(diff.next)}
            </Text>
          )}
        </div>
      ) : renderAsReference ? (
        <Text
          size="small"
          leading="compact"
          className="text-ui-fg-subtle flex-1 whitespace-pre-line text-pretty"
        >
          {hasPrevious && (
            <span className="line-through">
              <ReferenceList
                field={diff.field as ReferenceField}
                ids={extractIds(diff.field as ReferenceField, diff.previous)}
              />
            </span>
          )}
          {hasPrevious && " → "}
          <ReferenceList
            field={diff.field as ReferenceField}
            ids={extractIds(diff.field as ReferenceField, diff.next)}
          />
        </Text>
      ) : (
        <Text
          size="small"
          leading="compact"
          className="text-ui-fg-subtle flex-1 whitespace-pre-line text-pretty"
        >
          {hasPrevious && (
            <span className="line-through">{formatValue(diff.previous)}</span>
          )}
          {hasPrevious && " → "}
          {formatValue(diff.next)}
        </Text>
      )}
    </div>
  );
};

const partitionActions = (actions: ProductChangeActionDTO[]) => {
  const updated: FieldDiff[] = [];
  const added: ProductChangeActionDTO[] = [];
  const removed: ProductChangeActionDTO[] = [];
  let deleteRequested = false;

  for (const action of actions) {
    const details = action.details ?? {};

    switch (action.action) {
      case ProductChangeActionType.UPDATE: {
        updated.push({
          field: String(details.field ?? "—"),
          previous: details.previous_value,
          next: details.value,
        });
        break;
      }
      case ProductChangeActionType.STATUS_CHANGE: {
        updated.push({
          field: "status",
          previous: details.previous_status,
          next: details.status,
        });
        break;
      }
      case ProductChangeActionType.VARIANT_UPDATE: {
        const fields = (details.fields ?? {}) as Record<string, unknown>;
        const previousFields = (details.previous_fields ?? {}) as Record<
          string,
          unknown
        >;
        for (const [field, value] of Object.entries(fields)) {
          updated.push({
            field,
            previous: previousFields[field],
            next: value,
          });
        }
        break;
      }
      case ProductChangeActionType.VARIANT_ADD:
      case ProductChangeActionType.ATTRIBUTE_ADD:
        added.push(action);
        break;
      case ProductChangeActionType.VARIANT_REMOVE:
      case ProductChangeActionType.ATTRIBUTE_REMOVE:
        removed.push(action);
        break;
      case ProductChangeActionType.PRODUCT_DELETE:
        deleteRequested = true;
        break;
    }
  }

  return { updated, added, removed, deleteRequested };
};

const describeAction = (
  action: ProductChangeActionDTO,
  t: TFunction<"translation", undefined>,
): string => {
  const details = action.details ?? {};
  switch (action.action) {
    case ProductChangeActionType.VARIANT_ADD: {
      const variant = (details.variant ?? {}) as {
        title?: string;
        sku?: string;
      };
      return (
        variant.title ||
        variant.sku ||
        t("fields.variant", { defaultValue: "Variant" })
      );
    }
    case ProductChangeActionType.VARIANT_REMOVE:
      return String(details.variant_id ?? "");
    case ProductChangeActionType.ATTRIBUTE_ADD:
    case ProductChangeActionType.ATTRIBUTE_REMOVE:
      return String(details.attribute_id ?? "");
    default:
      return "";
  }
};

export const ProductActiveEditSection = ({
  productId,
}: ProductActiveEditSectionProps) => {
  const { t } = useTranslation();
  const prompt = usePrompt();

  const { product_change, isError } = useProductChange(productId, {
    retry: false,
  });

  const { mutateAsync: cancelEdit, isPending: isCanceling } =
    useCancelProductEdit(productId);

  const { updated, added, removed, deleteRequested } = useMemo(
    () => partitionActions(product_change?.actions ?? []),
    [product_change],
  );

  const onCancel = async () => {
    const confirmed = await prompt({
      title: t("products.edits.panel.cancelTitle"),
      description: t("products.edits.panel.cancelDescription"),
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    });

    if (!confirmed) return;

    try {
      await cancelEdit();
      toast.success(t("products.edits.toast.canceledSuccessfully"));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (isError || !product_change) {
    return null;
  }

  if (product_change.status !== ProductChangeStatus.PENDING) {
    return null;
  }

  const hasContent =
    updated.length > 0 ||
    added.length > 0 ||
    removed.length > 0 ||
    deleteRequested;

  return (
    <Container
      className="divide-y p-0"
      data-testid="product-active-edit-section"
    >
      <div className="flex items-center gap-2 px-6 py-4">
        <ExclamationCircleSolid className="text-ui-fg-interactive" />
        <Heading level="h2" data-testid="product-active-edit-heading">
          {t("products.edits.panel.title")}
        </Heading>
      </div>

      <div className="px-6 py-4">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {t("products.edits.panel.description")}
        </Text>
      </div>

      {hasContent && (
        <>
          {updated.length > 0 && (
            <div className="flex items-start gap-4 px-6 py-4">
              <Text
                size="small"
                weight="plus"
                leading="compact"
                className="text-ui-fg-subtle w-[160px] shrink-0"
              >
                {t("labels.updated")}
              </Text>
              <div className="flex flex-1 flex-col gap-y-4">
                {updated.map((diff, idx) => (
                  <FieldRow key={`${diff.field}-${idx}`} diff={diff} />
                ))}
              </div>
            </div>
          )}

          {added.length > 0 && (
            <div className="flex items-start gap-4 px-6 py-4">
              <Text
                size="small"
                weight="plus"
                leading="compact"
                className="text-ui-fg-subtle w-[160px] shrink-0"
              >
                {t("labels.added")}
              </Text>
              <div className="flex flex-1 flex-col gap-y-2">
                {added.map((action) => (
                  <Text
                    key={action.id}
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle"
                  >
                    {describeAction(action, t)}
                  </Text>
                ))}
              </div>
            </div>
          )}

          {removed.length > 0 && (
            <div className="flex items-start gap-4 px-6 py-4">
              <Text
                size="small"
                weight="plus"
                leading="compact"
                className="text-ui-fg-subtle w-[160px] shrink-0"
              >
                {t("labels.removed")}
              </Text>
              <div className="flex flex-1 flex-col gap-y-2">
                {removed.map((action) => (
                  <Text
                    key={action.id}
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle"
                  >
                    {describeAction(action, t)}
                  </Text>
                ))}
              </div>
            </div>
          )}

          {deleteRequested && (
            <div className="flex items-start gap-4 px-6 py-4">
              <Text
                size="small"
                weight="plus"
                leading="compact"
                className="text-ui-fg-subtle w-[160px] shrink-0"
              >
                {t("labels.removed")}
              </Text>
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle flex-1"
              >
                {t("products.edits.panel.deleteRequested")}
              </Text>
            </div>
          )}
        </>
      )}

      <div
        className="bg-ui-bg-subtle flex items-center justify-end gap-x-2 rounded-b-xl px-6 py-4"
        data-testid="product-active-edit-actions"
      >
        <Button
          size="small"
          variant="secondary"
          onClick={onCancel}
          disabled={isCanceling}
          isLoading={isCanceling}
          data-testid="product-active-edit-cancel-button"
        >
          {t("actions.cancel")}
        </Button>
      </div>
    </Container>
  );
};
