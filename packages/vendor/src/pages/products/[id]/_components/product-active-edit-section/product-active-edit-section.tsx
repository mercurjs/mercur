import { ExclamationCircleSolid } from "@medusajs/icons";
import { Button, Container, Heading, Text, toast, usePrompt } from "@medusajs/ui";
import { ProductChangeActionDTO, ProductChangeStatus } from "@mercurjs/types";
import {
  type FieldDiff,
  type ReferenceField,
  describeProductChangeAction,
  extractReferenceIds,
  formatFieldValue,
  humanizeFieldName,
  isImageList,
  isReferenceField,
  partitionProductChangeActions,
} from "@mercurjs/dashboard-shared";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo } from "react";
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
        {t(`fields.${diff.field}`, {
          defaultValue: humanizeFieldName(diff.field),
        })}
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
              {formatFieldValue(diff.next, diff.field)}
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
                ids={extractReferenceIds(
                  diff.field as ReferenceField,
                  diff.previous,
                )}
              />
            </span>
          )}
          {hasPrevious && " → "}
          <ReferenceList
            field={diff.field as ReferenceField}
            ids={extractReferenceIds(diff.field as ReferenceField, diff.next)}
          />
        </Text>
      ) : (
        <Text
          size="small"
          leading="compact"
          className="text-ui-fg-subtle flex-1 whitespace-pre-line text-pretty"
        >
          {hasPrevious && (
            <span className="line-through">
              {formatFieldValue(diff.previous, diff.field)}
            </span>
          )}
          {hasPrevious && " → "}
          {formatFieldValue(diff.next, diff.field)}
        </Text>
      )}
    </div>
  );
};

const ActionLine = ({ action }: { action: ProductChangeActionDTO }) => {
  const { t } = useTranslation();
  const label = describeProductChangeAction(action, {
    variant: t("fields.variant", { defaultValue: "Variant" }),
  });
  return (
    <Text size="small" leading="compact" className="text-ui-fg-subtle">
      {label}
    </Text>
  );
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
    () => partitionProductChangeActions(product_change?.actions ?? []),
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
                  <ActionLine key={action.id} action={action} />
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
                  <ActionLine key={action.id} action={action} />
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
