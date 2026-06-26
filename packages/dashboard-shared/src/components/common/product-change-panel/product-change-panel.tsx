import { ExclamationCircleSolid } from "@medusajs/icons";
import { Container, Heading, Text, clx } from "@medusajs/ui";
import { ProductChangeActionDTO } from "@mercurjs/types";
import { useQueries } from "@tanstack/react-query";
import { Fragment, ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Thumbnail } from "../thumbnail";
import {
  AttributeChange,
  FieldDiff,
  ImageRef,
  MediaDiff,
  VariantGroup,
  buildProductChangeView,
  extractReferenceIds,
  formatFieldValue,
  humanizeFieldName,
  isImageList,
  isReferenceField,
  productChangeViewHasContent,
  type BooleanLabels,
  type ReferenceField,
} from "../../../lib/product-change-diff";

type WrappedAttributeValue = { id: string; name?: string | null };

export type ProductChangeAttribute = {
  id: string;
  name?: string | null;
  /** Values currently selected on the product (the "previous" side). */
  values?: WrappedAttributeValue[] | null;
  /** Every possible value of the attribute, used to resolve value ids. */
  all_values?: WrappedAttributeValue[] | null;
};

export type ProductChangeVariant = {
  id: string;
  title?: string | null;
  sku?: string | null;
  images?: { url: string }[] | null;
};

export type ProductChangeProduct = {
  id: string;
  title?: string | null;
  thumbnail?: string | null;
  variants?: (ProductChangeVariant | null)[] | null;
  attributes?: ProductChangeAttribute[] | null;
};

export type ResolvedAttribute = {
  name: string;
  values: { id: string; name: string }[];
};

export type ProductChangeResolvers = {
  getType: (id: string) => Promise<string | null | undefined>;
  getCollection: (id: string) => Promise<string | null | undefined>;
  getCategory: (id: string) => Promise<string | null | undefined>;
  getTag: (id: string) => Promise<string | null | undefined>;
  getAttribute: (id: string) => Promise<ResolvedAttribute | null | undefined>;
  getVariant: (
    variantId: string,
  ) => Promise<ProductChangeVariant | null | undefined>;
};

export type ProductChangePanelProps = {
  product: ProductChangeProduct;
  actions: ProductChangeActionDTO[];
  resolvers: ProductChangeResolvers;
  headerDescription?: ReactNode;
  footer?: ReactNode;
};

const COL1 = "text-ui-fg-subtle w-[120px] shrink-0";
const COL2 = "text-ui-fg-subtle w-[160px] shrink-0";

const ImageStrip = ({
  images,
  faded,
}: {
  images: ImageRef[];
  faded?: boolean;
}) => (
  <div
    className={clx(
      "flex flex-wrap items-center gap-1.5",
      faded && "opacity-50",
    )}
  >
    {images.map((image, idx) => (
      <Thumbnail key={`${image.url}-${idx}`} src={image.url} size="base" />
    ))}
  </div>
);

const GroupRow = ({
  label,
  children,
  testId,
}: {
  label: ReactNode;
  children: ReactNode;
  testId?: string;
}) => (
  <div className="flex items-start gap-4 px-6 py-4" data-testid={testId}>
    <Text size="small" weight="plus" leading="compact" className={COL1}>
      {label}
    </Text>
    <div className="flex flex-1 flex-col gap-y-4">{children}</div>
  </div>
);

const ItemRow = ({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) => (
  <div className="flex items-start gap-4">
    <Text size="small" weight="plus" leading="compact" className={COL2}>
      {label}
    </Text>
    <div className="flex-1">{children}</div>
  </div>
);

const ValueText = ({ children }: { children: ReactNode }) => (
  <Text
    size="small"
    leading="compact"
    className="text-ui-fg-subtle whitespace-pre-line text-pretty"
  >
    {children}
  </Text>
);

type NameLookup = Map<string, string>;

const referenceName = (
  field: ReferenceField,
  id: string,
  lookups: {
    types: NameLookup;
    collections: NameLookup;
    categories: NameLookup;
    tags: NameLookup;
  },
): string => {
  switch (field) {
    case "type_id":
      return lookups.types.get(id) ?? id;
    case "collection_id":
      return lookups.collections.get(id) ?? id;
    case "categories":
      return lookups.categories.get(id) ?? id;
    case "tags":
      return lookups.tags.get(id) ?? id;
  }
};

const ReferenceValue = ({
  field,
  value,
  lookups,
}: {
  field: ReferenceField;
  value: unknown;
  lookups: {
    types: NameLookup;
    collections: NameLookup;
    categories: NameLookup;
    tags: NameLookup;
  };
}) => {
  const ids = extractReferenceIds(field, value);
  if (!ids.length) return <>-</>;
  return (
    <>
      {ids.map((id, idx) => (
        <Fragment key={`${field}-${id}`}>
          {idx > 0 && ", "}
          {referenceName(field, id, lookups)}
        </Fragment>
      ))}
    </>
  );
};

const hasPreviousValue = (previous: unknown): boolean =>
  previous !== undefined &&
  previous !== null &&
  previous !== "" &&
  !(Array.isArray(previous) && previous.length === 0);

const FieldDiffValue = ({
  diff,
  lookups,
}: {
  diff: FieldDiff;
  lookups: {
    types: NameLookup;
    collections: NameLookup;
    categories: NameLookup;
    tags: NameLookup;
  };
}) => {
  const { t } = useTranslation();
  const booleanLabels: BooleanLabels = {
    true: t("general.yes"),
    false: t("general.no"),
  };
  const hasPrev = hasPreviousValue(diff.previous);

  if (isImageList(diff.next) || isImageList(diff.previous)) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {hasPrev && isImageList(diff.previous) && (
          <ImageStrip images={diff.previous as ImageRef[]} faded />
        )}
        {hasPrev && <ValueText>→</ValueText>}
        {isImageList(diff.next) ? (
          <ImageStrip images={diff.next as ImageRef[]} />
        ) : (
          <ValueText>
            {formatFieldValue(diff.next, diff.field, booleanLabels)}
          </ValueText>
        )}
      </div>
    );
  }

  if (isReferenceField(diff.field)) {
    return (
      <ValueText>
        {hasPrev && (
          <span className="line-through">
            <ReferenceValue
              field={diff.field}
              value={diff.previous}
              lookups={lookups}
            />
          </span>
        )}
        {hasPrev && " → "}
        <ReferenceValue
          field={diff.field}
          value={diff.next}
          lookups={lookups}
        />
      </ValueText>
    );
  }

  return (
    <ValueText>
      {hasPrev && (
        <span className="line-through">
          {formatFieldValue(diff.previous, diff.field, booleanLabels)}
        </span>
      )}
      {hasPrev && " → "}
      {formatFieldValue(diff.next, diff.field, booleanLabels)}
    </ValueText>
  );
};

type AttributeLookupEntry = {
  name: string;
  valueNameById: Map<string, string>;
  selectedNames: string[];
};

const attributeDisplay = (
  change: AttributeChange,
  lookup: Map<string, AttributeLookupEntry>,
  booleanLabels: BooleanLabels,
): { name: string; previous: string | null; next: string } => {
  const entry = change.attributeId ? lookup.get(change.attributeId) : undefined;
  const name = entry?.name ?? change.inlineTitle ?? change.attributeId ?? "-";
  const resolveIds = (ids: string[]): string[] =>
    ids.map((id) => entry?.valueNameById.get(id) ?? id);

  if (change.kind === "removed") {
    const prev = entry?.selectedNames ?? [];
    return { name, previous: prev.length ? prev.join(", ") : null, next: "" };
  }

  if (change.kind === "added") {
    const names = [...change.addValueNames, ...resolveIds(change.addValueIds)];
    if (change.scalarValue !== undefined && change.scalarValue !== null) {
      names.push(formatFieldValue(change.scalarValue, undefined, booleanLabels));
    }
    return {
      name,
      previous: null,
      next: names.length ? names.join(", ") : "-",
    };
  }

  // updated
  if (change.scalarValue !== undefined && change.scalarValue !== null) {
    const prev = entry?.selectedNames?.[0];
    return {
      name,
      previous: prev ?? null,
      next: formatFieldValue(change.scalarValue, undefined, booleanLabels),
    };
  }
  const prevNames = entry?.selectedNames ?? [];
  const removedNames = resolveIds(change.removeValueIds);
  const addedNames = [
    ...change.addValueNames,
    ...resolveIds(change.addValueIds),
  ];
  const nextNames = prevNames
    .filter((n) => !removedNames.includes(n))
    .concat(addedNames);
  return {
    name,
    previous: prevNames.length ? prevNames.join(", ") : null,
    next: nextNames.length ? nextNames.join(", ") : "-",
  };
};

const AttributeValue = ({
  change,
  lookup,
}: {
  change: AttributeChange;
  lookup: Map<string, AttributeLookupEntry>;
}) => {
  const { t } = useTranslation();
  const { name, previous, next } = attributeDisplay(change, lookup, {
    true: t("general.yes"),
    false: t("general.no"),
  });

  if (change.kind === "removed") {
    return (
      <ValueText>
        {name}
        {previous && (
          <>
            {" / "}
            <span className="line-through">{previous}</span>
          </>
        )}
      </ValueText>
    );
  }

  return (
    <ValueText>
      {name}
      {" / "}
      {previous && (
        <>
          <span className="line-through">{previous}</span>
          {" → "}
        </>
      )}
      {next}
    </ValueText>
  );
};

const VariantIdentity = ({
  variant,
  variantFallback,
}: {
  variant?: ProductChangeVariant | null;
  variantFallback: string;
}) => {
  const title = variant?.title || variant?.sku || variantFallback;
  const sku = variant?.sku && variant.sku !== title ? variant.sku : undefined;
  const src =
    variant?.images && variant.images.length > 0 ? variant.images[0].url : null;
  return (
    <div className="flex items-center gap-2">
      <Thumbnail src={src} size="base" />
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        <span className="text-ui-fg-base font-medium">{title}</span>
        {sku ? ` · ${sku}` : null}
      </Text>
    </div>
  );
};

export const ProductChangePanel = ({
  product,
  actions,
  resolvers,
  headerDescription,
  footer,
}: ProductChangePanelProps) => {
  const { t } = useTranslation();

  const view = useMemo(() => buildProductChangeView(actions), [actions]);

  const variantsById = useMemo(() => {
    const map = new Map<string, ProductChangeVariant>();
    for (const variant of product.variants ?? []) {
      if (variant?.id) map.set(variant.id, variant);
    }
    return map;
  }, [product.variants]);

  const productAttributesById = useMemo(() => {
    const map = new Map<string, ProductChangeAttribute>();
    for (const attr of product.attributes ?? []) {
      if (attr?.id) map.set(attr.id, attr);
    }
    return map;
  }, [product.attributes]);

  // Collect ids to resolve, grouped by kind.
  const referenceIds = useMemo(() => {
    const types = new Set<string>();
    const collections = new Set<string>();
    const categories = new Set<string>();
    const tags = new Set<string>();
    const collect = (field: ReferenceField, value: unknown) => {
      for (const id of extractReferenceIds(field, value)) {
        if (field === "type_id") types.add(id);
        else if (field === "collection_id") collections.add(id);
        else if (field === "categories") categories.add(id);
        else tags.add(id);
      }
    };
    for (const diff of view.productUpdated) {
      if (isReferenceField(diff.field)) {
        collect(diff.field, diff.previous);
        collect(diff.field, diff.next);
      }
    }
    return {
      types: Array.from(types),
      collections: Array.from(collections),
      categories: Array.from(categories),
      tags: Array.from(tags),
    };
  }, [view.productUpdated]);

  // Attribute ids that are not already on the product (added-by-id needs a fetch).
  const attributeIdsToFetch = useMemo(() => {
    const ids = new Set<string>();
    for (const change of view.attributes) {
      if (
        change.attributeId &&
        !productAttributesById.has(change.attributeId)
      ) {
        ids.add(change.attributeId);
      }
    }
    return Array.from(ids);
  }, [view.attributes, productAttributesById]);

  // Variant ids needing identity resolution (removed + grouped updates) that
  // are not already carried inline on the product payload.
  const variantIdsToFetch = useMemo(() => {
    const ids = new Set<string>();
    for (const action of view.variantsRemoved) {
      const id = (action.details as { variant_id?: string })?.variant_id;
      if (id && !variantsById.has(id)) ids.add(id);
    }
    for (const group of view.variantGroups) {
      if (!variantsById.has(group.variantId)) ids.add(group.variantId);
    }
    return Array.from(ids);
  }, [view.variantsRemoved, view.variantGroups, variantsById]);

  const typeQueries = useQueries({
    queries: referenceIds.types.map((id) => ({
      queryKey: ["pcp", "type", id],
      queryFn: () => resolvers.getType(id),
    })),
  });
  const collectionQueries = useQueries({
    queries: referenceIds.collections.map((id) => ({
      queryKey: ["pcp", "collection", id],
      queryFn: () => resolvers.getCollection(id),
    })),
  });
  const categoryQueries = useQueries({
    queries: referenceIds.categories.map((id) => ({
      queryKey: ["pcp", "category", id],
      queryFn: () => resolvers.getCategory(id),
    })),
  });
  const tagQueries = useQueries({
    queries: referenceIds.tags.map((id) => ({
      queryKey: ["pcp", "tag", id],
      queryFn: () => resolvers.getTag(id),
    })),
  });
  const attributeQueries = useQueries({
    queries: attributeIdsToFetch.map((id) => ({
      queryKey: ["pcp", "attribute", id],
      queryFn: () => resolvers.getAttribute(id),
    })),
  });
  const variantQueries = useQueries({
    queries: variantIdsToFetch.map((id) => ({
      queryKey: ["pcp", "variant", id],
      queryFn: () => resolvers.getVariant(id),
    })),
  });

  const isResolving =
    typeQueries.some((q) => q.isPending) ||
    collectionQueries.some((q) => q.isPending) ||
    categoryQueries.some((q) => q.isPending) ||
    tagQueries.some((q) => q.isPending) ||
    attributeQueries.some((q) => q.isPending) ||
    variantQueries.some((q) => q.isPending);

  const lookups = useMemo(() => {
    const toMap = (ids: string[], queries: { data?: string | null }[]) => {
      const map: NameLookup = new Map();
      ids.forEach((id, idx) => {
        const name = queries[idx]?.data;
        if (name) map.set(id, name);
      });
      return map;
    };
    return {
      types: toMap(referenceIds.types, typeQueries),
      collections: toMap(referenceIds.collections, collectionQueries),
      categories: toMap(referenceIds.categories, categoryQueries),
      tags: toMap(referenceIds.tags, tagQueries),
    };
  }, [
    referenceIds,
    typeQueries,
    collectionQueries,
    categoryQueries,
    tagQueries,
  ]);

  const attributeLookup = useMemo(() => {
    const map = new Map<string, AttributeLookupEntry>();
    const addEntry = (
      id: string,
      name: string,
      allValues: WrappedAttributeValue[],
      selected: WrappedAttributeValue[],
    ) => {
      const valueNameById = new Map<string, string>();
      for (const v of allValues) {
        if (v?.id) valueNameById.set(v.id, v.name ?? v.id);
      }
      map.set(id, {
        name,
        valueNameById,
        selectedNames: selected
          .map((v) => v?.name ?? v?.id ?? "")
          .filter(Boolean),
      });
    };
    for (const attr of product.attributes ?? []) {
      if (!attr?.id) continue;
      addEntry(
        attr.id,
        attr.name ?? attr.id,
        attr.all_values ?? [],
        attr.values ?? [],
      );
    }
    attributeIdsToFetch.forEach((id, idx) => {
      const data = attributeQueries[idx]?.data;
      if (data) addEntry(id, data.name, data.values, []);
    });
    return map;
  }, [product.attributes, attributeIdsToFetch, attributeQueries]);

  const resolvedVariant = (id: string): ProductChangeVariant | undefined => {
    const inline = variantsById.get(id);
    if (inline) return inline;
    const idx = variantIdsToFetch.indexOf(id);
    if (idx >= 0) {
      const data = variantQueries[idx]?.data;
      if (data) return data;
    }
    return undefined;
  };

  const variantFallback = t("fields.variant", { defaultValue: "Variant" });
  const typeAttribute = t("products.edits.types.attribute", {
    defaultValue: "Attribute",
  });
  const typeMedia = t("products.edits.types.media", { defaultValue: "Media" });
  const typeVariant = t("products.edits.types.variant", {
    defaultValue: "Variant",
  });
  const typeProduct = t("products.edits.types.product", {
    defaultValue: "Product",
  });

  const fieldLabel = (field: string): string => {
    if (field === "categories") {
      return t("fields.category");
    }
    return t(`fields.${field}`, { defaultValue: humanizeFieldName(field) });
  };

  const attrsByKind = (kind: AttributeChange["kind"]) =>
    view.attributes.filter((a) => a.kind === kind);

  const updatedAttributes = attrsByKind("updated");
  const addedAttributes = attrsByKind("added");
  const removedAttributes = attrsByKind("removed");

  const hasUpdatedGroup =
    view.productUpdated.length > 0 || updatedAttributes.length > 0;
  const hasAddedGroup =
    view.variantsAdded.length > 0 ||
    addedAttributes.length > 0 ||
    view.productMedia.added.length > 0;
  const hasRemovedGroup =
    view.variantsRemoved.length > 0 ||
    removedAttributes.length > 0 ||
    view.productMedia.removed.length > 0 ||
    view.deleteRequested;

  const variantAddIdentity = (
    action: ProductChangeActionDTO,
  ): ProductChangeVariant => {
    const details = (action.details ?? {}) as {
      variant?: { title?: string; sku?: string };
    };
    return {
      id: action.id,
      title: details.variant?.title,
      sku: details.variant?.sku,
    };
  };

  const hasContent = productChangeViewHasContent(view);

  if (isResolving) {
    return null;
  }

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
      {headerDescription && (
        <div className="px-6 py-4">{headerDescription}</div>
      )}
      {hasContent && (
        <div className="divide-y divide-dashed">
          {hasUpdatedGroup && (
            <GroupRow
              label={t("labels.updated")}
              testId="product-active-edit-updated"
            >
              {view.productUpdated.map((diff, idx) => (
                <ItemRow
                  key={`u-${diff.field}-${idx}`}
                  label={fieldLabel(diff.field)}
                >
                  <FieldDiffValue diff={diff} lookups={lookups} />
                </ItemRow>
              ))}
              {updatedAttributes.map((change, idx) => (
                <ItemRow key={`ua-${idx}`} label={typeAttribute}>
                  <AttributeValue change={change} lookup={attributeLookup} />
                </ItemRow>
              ))}
            </GroupRow>
          )}

          {hasAddedGroup && (
            <GroupRow
              label={t("labels.added")}
              testId="product-active-edit-added"
            >
              {view.variantsAdded.map((action) => (
                <ItemRow key={`av-${action.id}`} label={typeVariant}>
                  <VariantIdentity
                    variant={variantAddIdentity(action)}
                    variantFallback={variantFallback}
                  />
                </ItemRow>
              ))}
              {addedAttributes.map((change, idx) => (
                <ItemRow key={`aa-${idx}`} label={typeAttribute}>
                  <AttributeValue change={change} lookup={attributeLookup} />
                </ItemRow>
              ))}
              {view.productMedia.added.length > 0 && (
                <ItemRow label={typeMedia}>
                  <ImageStrip images={view.productMedia.added} />
                </ItemRow>
              )}
            </GroupRow>
          )}

          {hasRemovedGroup && (
            <GroupRow
              label={t("labels.removed")}
              testId="product-active-edit-removed"
            >
              {view.variantsRemoved.map((action) => {
                const id = (action.details as { variant_id?: string })
                  ?.variant_id;
                return (
                  <ItemRow key={`rv-${action.id}`} label={typeVariant}>
                    <VariantIdentity
                      variant={id ? resolvedVariant(id) : undefined}
                      variantFallback={variantFallback}
                    />
                  </ItemRow>
                );
              })}
              {removedAttributes.map((change, idx) => (
                <ItemRow key={`ra-${idx}`} label={typeAttribute}>
                  <AttributeValue change={change} lookup={attributeLookup} />
                </ItemRow>
              ))}
              {view.productMedia.removed.length > 0 && (
                <ItemRow label={typeMedia}>
                  <ImageStrip images={view.productMedia.removed} />
                </ItemRow>
              )}
              {view.deleteRequested && (
                <ItemRow label={typeProduct}>
                  <div className="flex items-center gap-2">
                    <Thumbnail src={product.thumbnail} size="base" />
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-base font-medium"
                    >
                      {product.title ?? product.id}
                    </Text>
                  </div>
                </ItemRow>
              )}
            </GroupRow>
          )}

          {view.variantGroups.map((group) => (
            <VariantGroupBlock
              key={group.variantId}
              group={group}
              variant={resolvedVariant(group.variantId)}
              variantLabel={typeVariant}
              variantFallback={variantFallback}
              mediaLabel={typeMedia}
              updatedLabel={t("labels.updated")}
              addedLabel={t("labels.added")}
              removedLabel={t("labels.removed")}
              fieldLabel={fieldLabel}
              lookups={lookups}
            />
          ))}
        </div>
      )}
      {footer && (
        <div
          className="bg-ui-bg-subtle flex items-center justify-end gap-x-2 rounded-b-xl px-6 py-4"
          data-testid="product-active-edit-actions"
        >
          {footer}
        </div>
      )}
    </Container>
  );
};

const VariantGroupBlock = ({
  group,
  variant,
  variantLabel,
  variantFallback,
  mediaLabel,
  updatedLabel,
  addedLabel,
  removedLabel,
  fieldLabel,
  lookups,
}: {
  group: VariantGroup;
  variant?: ProductChangeVariant;
  variantLabel: string;
  variantFallback: string;
  mediaLabel: string;
  updatedLabel: string;
  addedLabel: string;
  removedLabel: string;
  fieldLabel: (field: string) => string;
  lookups: {
    types: NameLookup;
    collections: NameLookup;
    categories: NameLookup;
    tags: NameLookup;
  };
}) => {
  const media: MediaDiff = group.media;
  return (
    <div className="divide-y divide-dashed">
      <div
        className="flex items-start gap-4 px-6 py-4"
        data-testid={`product-active-edit-variant-${group.variantId}`}
      >
        <Text size="small" weight="plus" leading="compact" className={COL1}>
          {variantLabel}
        </Text>
        <div className="flex-1">
          <VariantIdentity
            variant={variant}
            variantFallback={variantFallback}
          />
        </div>
      </div>

      {group.fieldDiffs.length > 0 && (
        <GroupRow label={updatedLabel}>
          {group.fieldDiffs.map((diff, idx) => (
            <ItemRow
              key={`vu-${diff.field}-${idx}`}
              label={fieldLabel(diff.field)}
            >
              <FieldDiffValue diff={diff} lookups={lookups} />
            </ItemRow>
          ))}
        </GroupRow>
      )}

      {media.added.length > 0 && (
        <GroupRow label={addedLabel}>
          <ItemRow label={mediaLabel}>
            <ImageStrip images={media.added} />
          </ItemRow>
        </GroupRow>
      )}

      {media.removed.length > 0 && (
        <GroupRow label={removedLabel}>
          <ItemRow label={mediaLabel}>
            <ImageStrip images={media.removed} />
          </ItemRow>
        </GroupRow>
      )}
    </div>
  );
};
