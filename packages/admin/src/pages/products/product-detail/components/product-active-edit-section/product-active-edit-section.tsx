import { Fragment, useMemo, useState } from "react";
import { ExclamationCircleSolid } from "@medusajs/icons";
import { Button, Container, Heading, Text, toast } from "@medusajs/ui";
import {
  ProductChangeActionDTO,
  ProductChangeActionType,
  SellerDTO,
  ProductChangeStatus,
} from "@mercurjs/types";
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
import { HttpTypes } from "@medusajs/types";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { ConfirmPrompt } from "../../../../../components/common/confirm-prompt";
import { Thumbnail } from "../../../../../components/common/thumbnail";
import { useProductCategory } from "../../../../../hooks/api/categories";
import { useCollection } from "../../../../../hooks/api/collections";
import {
  productAttributesQueryKeys,
  useProductAttribute,
} from "../../../../../hooks/api/product-attributes";
import { useProductTag } from "../../../../../hooks/api/tags";
import { useProductType } from "../../../../../hooks/api/product-types";
import {
  useCancelProductChange,
  useConfirmProductChange,
  useProductChange,
  variantsQueryKeys,
} from "../../../../../hooks/api/products";
import { useSeller } from "../../../../../hooks/api/sellers";
import { sdk } from "../../../../../lib/client";

type ProductWithSellers = HttpTypes.AdminProduct & {
  sellers?: SellerDTO[];
};

type ProductActiveEditSectionProps = {
  product: ProductWithSellers;
};

type VariantInfo = {
  id: string;
  title?: string | null;
  sku?: string | null;
  images?: { url: string }[] | null;
};

const VARIANT_LOOKUP_FIELDS = "id,title,sku,*images";

const ImageStrip = ({
  images,
  faded,
}: {
  images: { url: string }[];
  faded?: boolean;
}) => (
  <div
    className={
      faded
        ? "flex items-center gap-1.5 opacity-50"
        : "flex items-center gap-1.5"
    }
  >
    {images.map((image, idx) => (
      <Thumbnail key={`${image.url}-${idx}`} src={image.url} size="base" />
    ))}
  </div>
);

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

const AttributeActionLine = ({
  attributeId,
  valueIds,
}: {
  attributeId: string;
  valueIds?: string[];
}) => {
  const { product_attribute } = useProductAttribute(attributeId);

  const name = product_attribute?.name ?? attributeId;
  const values = product_attribute?.values ?? [];
  const selectedNames =
    valueIds && valueIds.length
      ? valueIds.map((id) => {
          const match = values.find((v) => v.id === id);
          return match?.name ?? id;
        })
      : [];

  return (
    <Text size="small" leading="compact" className="text-ui-fg-subtle">
      <span className="font-medium text-ui-fg-base">{name}</span>
      {selectedNames.length > 0 && `: ${selectedNames.join(", ")}`}
    </Text>
  );
};

const VariantActionLine = ({
  title,
  images,
}: {
  title: string;
  images?: { url: string }[];
}) => (
  <div className="flex items-center gap-3">
    {images && images.length > 0 && <ImageStrip images={images} />}
    <Text size="small" leading="compact" className="text-ui-fg-subtle">
      <span className="font-medium text-ui-fg-base">{title}</span>
    </Text>
  </div>
);

const ActionLine = ({
  action,
  variantsById,
}: {
  action: ProductChangeActionDTO;
  variantsById: Map<string, VariantInfo>;
}) => {
  const { t } = useTranslation();
  const details = (action.details ?? {}) as {
    attribute_id?: string;
    attribute_value_ids?: string[];
    variant_id?: string;
    variant?: { title?: string; sku?: string };
  };

  if (
    action.action === ProductChangeActionType.ATTRIBUTE_ADD ||
    action.action === ProductChangeActionType.ATTRIBUTE_REMOVE
  ) {
    if (!details.attribute_id) return null;
    return (
      <AttributeActionLine
        attributeId={details.attribute_id}
        valueIds={
          action.action === ProductChangeActionType.ATTRIBUTE_ADD
            ? details.attribute_value_ids
            : undefined
        }
      />
    );
  }

  const variantFallback = t("fields.variant", { defaultValue: "Variant" });

  if (action.action === ProductChangeActionType.VARIANT_ADD) {
    const title =
      details.variant?.title || details.variant?.sku || variantFallback;
    return <VariantActionLine title={title} />;
  }

  if (action.action === ProductChangeActionType.VARIANT_REMOVE) {
    const variantId = details.variant_id ?? "";
    const found = variantId ? variantsById.get(variantId) : undefined;
    const title =
      found?.title || found?.sku || variantId || variantFallback;
    const images = isImageList(found?.images) ? found?.images : undefined;
    return <VariantActionLine title={title} images={images} />;
  }

  const label = describeProductChangeAction(action, {
    variant: variantFallback,
  });
  return (
    <Text size="small" leading="compact" className="text-ui-fg-subtle">
      {label}
    </Text>
  );
};

const VariantUpdateBlock = ({
  variantId,
  diffs,
  variantsById,
}: {
  variantId: string;
  diffs: FieldDiff[];
  variantsById: Map<string, VariantInfo>;
}) => {
  const { t } = useTranslation();
  const found = variantsById.get(variantId);
  const variantFallback = t("fields.variant", { defaultValue: "Variant" });
  const title = found?.title || found?.sku || variantId || variantFallback;
  // Only append the SKU when it adds information beyond the title.
  const sku = found?.sku && title !== found.sku ? found.sku : undefined;
  const images = isImageList(found?.images) ? found?.images : undefined;

  return (
    <>
      <div
        className="flex items-start gap-4 px-6 py-4"
        data-testid={`product-active-edit-variant-${variantId}`}
      >
        <Text
          size="small"
          weight="plus"
          leading="compact"
          className="text-ui-fg-subtle w-[160px] shrink-0"
        >
          {variantFallback}
        </Text>
        <div className="flex flex-1 items-center gap-2">
          {images && images.length > 0 && <ImageStrip images={images} />}
          <Text
            size="small"
            leading="compact"
            className="text-ui-fg-base font-medium"
          >
            {title}
          </Text>
          {sku && (
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {`· ${sku}`}
            </Text>
          )}
        </div>
      </div>

      {diffs.length > 0 && (
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
            {diffs.map((diff, idx) => (
              <FieldRow key={`${variantId}-${diff.field}-${idx}`} diff={diff} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export const ProductActiveEditSection = ({
  product,
}: ProductActiveEditSectionProps) => {
  const { t } = useTranslation();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const { product_change, isError } = useProductChange(product.id, {
    retry: false,
  });

  const requesterId = product_change?.created_by ?? "";
  const { seller: requesterSeller } = useSeller(requesterId, undefined, {
    enabled: !!requesterId,
  });

  const { mutateAsync: confirmChange, isPending: isConfirming } =
    useConfirmProductChange(product_change?.id ?? "", product.id);
  const { mutateAsync: cancelChange, isPending: isRejecting } =
    useCancelProductChange(product_change?.id ?? "", product.id);

  const { updated, added, removed, deleteRequested } = useMemo(
    () => partitionProductChangeActions(product_change?.actions ?? []),
    [product_change],
  );

  const productUpdated = useMemo(
    () => updated.filter((d) => !d.variant_id),
    [updated],
  );

  const variantsUpdated = useMemo(() => {
    const groups = new Map<string, FieldDiff[]>();
    for (const diff of updated) {
      if (!diff.variant_id) continue;
      const bucket = groups.get(diff.variant_id) ?? [];
      bucket.push(diff);
      groups.set(diff.variant_id, bucket);
    }
    return groups;
  }, [updated]);

  const attributeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const action of [...added, ...removed]) {
      if (
        action.action === ProductChangeActionType.ATTRIBUTE_ADD ||
        action.action === ProductChangeActionType.ATTRIBUTE_REMOVE
      ) {
        const details = (action.details ?? {}) as { attribute_id?: string };
        if (details.attribute_id) ids.add(details.attribute_id);
      }
    }
    return Array.from(ids);
  }, [added, removed]);

  const attributeQueries = useQueries({
    queries: attributeIds.map((id) => ({
      queryKey: productAttributesQueryKeys.detail(id),
      queryFn: () => sdk.admin.productAttributes.$id.query({ $id: id }),
    })),
  });

  const isLoadingAttributes = attributeQueries.some((q) => q.isPending);

  const variantIds = useMemo(() => {
    const ids = new Set<string>();
    for (const action of removed) {
      if (action.action === ProductChangeActionType.VARIANT_REMOVE) {
        const details = (action.details ?? {}) as { variant_id?: string };
        if (details.variant_id) ids.add(details.variant_id);
      }
    }
    for (const diff of updated) {
      if (diff.variant_id) ids.add(diff.variant_id);
    }
    return Array.from(ids);
  }, [removed, updated]);

  const variantQueryInput = { fields: VARIANT_LOOKUP_FIELDS } as const;

  const variantQueries = useQueries({
    queries: variantIds.map((variantId) => ({
      queryKey: variantsQueryKeys.detail(variantId, variantQueryInput),
      queryFn: () =>
        sdk.admin.products.$id.variants.$variantId.query({
          $id: product.id,
          $variantId: variantId,
          ...variantQueryInput,
        }),
    })),
  });

  const isLoadingVariants = variantQueries.some((q) => q.isPending);

  const variantsById = useMemo(() => {
    const map = new Map<string, VariantInfo>();
    for (const query of variantQueries) {
      const variant = (
        query.data as { variant?: VariantInfo } | undefined
      )?.variant;
      if (variant?.id) map.set(variant.id, variant);
    }
    return map;
  }, [variantQueries]);

  if (isError || !product_change) {
    return null;
  }

  if (product_change.status !== ProductChangeStatus.PENDING) {
    return null;
  }

  if (isLoadingAttributes || isLoadingVariants) {
    return null;
  }

  const hasContent =
    productUpdated.length > 0 ||
    variantsUpdated.size > 0 ||
    added.length > 0 ||
    removed.length > 0 ||
    deleteRequested;

  const handleConfirm = async (note: string | undefined) => {
    try {
      await confirmChange({ internal_note: note });
      toast.success(t("products.edits.toast.confirmedSuccessfully"));
      setConfirmOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleReject = async (note: string | undefined) => {
    try {
      await cancelChange({ internal_note: note });
      toast.success(t("products.edits.toast.rejectedSuccessfully"));
      setRejectOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

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
          {t("products.edits.panel.description", {
            store: requesterSeller?.name ?? t("products.request.fallbackStore"),
          })}
        </Text>
      </div>

      {hasContent && (
        <>
          {productUpdated.length > 0 && (
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
                {productUpdated.map((diff, idx) => (
                  <FieldRow key={`${diff.field}-${idx}`} diff={diff} />
                ))}
              </div>
            </div>
          )}

          {variantsUpdated.size > 0 &&
            Array.from(variantsUpdated.entries()).map(([variantId, diffs]) => (
              <VariantUpdateBlock
                key={variantId}
                variantId={variantId}
                diffs={diffs}
                variantsById={variantsById}
              />
            ))}

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
                  <ActionLine
                    key={action.id}
                    action={action}
                    variantsById={variantsById}
                  />
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
                  <ActionLine
                    key={action.id}
                    action={action}
                    variantsById={variantsById}
                  />
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
          onClick={() => setConfirmOpen(true)}
          data-testid="product-active-edit-confirm-button"
        >
          {t("actions.confirm")}
        </Button>
        <Button
          size="small"
          variant="secondary"
          onClick={() => setRejectOpen(true)}
          data-testid="product-active-edit-reject-button"
        >
          {t("products.edits.actions.reject")}
        </Button>
      </div>

      <ConfirmPrompt
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("products.edits.confirmPrompt.title")}
        description={t("products.edits.confirmPrompt.description")}
        noteLabel={t("products.edits.confirmPrompt.noteLabel")}
        noteOptional
        notePlaceholder={t("products.edits.confirmPrompt.notePlaceholder")}
        isLoading={isConfirming}
        onConfirm={handleConfirm}
      />

      <ConfirmPrompt
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={t("products.edits.rejectPrompt.title")}
        description={t("products.edits.rejectPrompt.description")}
        noteLabel={t("products.edits.rejectPrompt.noteLabel")}
        noteOptional
        notePlaceholder={t("products.edits.rejectPrompt.notePlaceholder")}
        confirmLabel={t("products.edits.rejectPrompt.confirm")}
        isLoading={isRejecting}
        onConfirm={handleReject}
      />
    </Container>
  );
};
