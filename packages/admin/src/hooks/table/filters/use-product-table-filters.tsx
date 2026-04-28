import { useTranslation } from "react-i18next";
import { ProductStatus } from "@mercurjs/types";
import { Filter } from "../../../components/table/data-table";
import { useProductTags, useProductCategories, useCollections } from "../../api";
import { useProductTypes } from "../../api/product-types";

const excludeableFields = [
  "collections",
  "categories",
  "product_types",
  "product_tags",
] as const;

export const useProductTableFilters = (
  exclude?: (typeof excludeableFields)[number][],
) => {
  const { t } = useTranslation();

  const isCategoryExcluded = exclude?.includes("categories");
  const isCollectionExcluded = exclude?.includes("collections");
  const isProductTypeExcluded = exclude?.includes("product_types");
  const isProductTagExcluded = exclude?.includes("product_tags");

  const { product_types } = useProductTypes(
    { limit: 1000, offset: 0 },
    { enabled: !isProductTypeExcluded },
  );

  const { product_tags } = useProductTags(
    { limit: 1000, offset: 0 },
    { enabled: !isProductTagExcluded },
  );

  const { product_categories } = useProductCategories(
    { limit: 1000, offset: 0, fields: "id,name" },
    { enabled: !isCategoryExcluded },
  );

  const { collections } = useCollections(
    { limit: 1000, offset: 0 },
    { enabled: !isCollectionExcluded },
  );

  let filters: Filter[] = [];

  if (product_categories && !isCategoryExcluded) {
    const categoryFilter: Filter = {
      key: "category_id",
      label: t("fields.category"),
      type: "select",
      multiple: true,
      searchable: true,
      options: product_categories.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    };

    filters = [...filters, categoryFilter];
  }

  if (collections && !isCollectionExcluded) {
    const collectionFilter: Filter = {
      key: "collection_id",
      label: t("fields.collection"),
      type: "select",
      multiple: true,
      searchable: true,
      options: collections.map((c) => ({
        label: c.title,
        value: c.id,
      })),
    };

    filters = [...filters, collectionFilter];
  }

  if (product_types && !isProductTypeExcluded) {
    const typeFilter: Filter = {
      key: "type_id",
      label: t("fields.type"),
      type: "select",
      multiple: true,
      searchable: true,
      options: product_types.map((t) => ({
        label: t.value,
        value: t.id,
      })),
    };

    filters = [...filters, typeFilter];
  }

  if (product_tags && !isProductTagExcluded) {
    const tagFilter: Filter = {
      key: "tag_id",
      label: t("fields.tag"),
      type: "select",
      multiple: true,
      searchable: true,
      options: product_tags.map((t) => ({
        label: t.value,
        value: t.id,
      })),
    };

    filters = [...filters, tagFilter];
  }

  const statusFilter: Filter = {
    key: "status",
    label: t("fields.status"),
    type: "select",
    multiple: true,
    options: [
      {
        label: t("products.productStatus.draft"),
        value: ProductStatus.DRAFT,
      },
      {
        label: t("products.productStatus.proposed"),
        value: ProductStatus.PROPOSED,
      },
      {
        label: t("products.productStatus.published"),
        value: ProductStatus.PUBLISHED,
      },
      {
        label: t("products.productStatus.changes_required"),
        value: ProductStatus.CHANGES_REQUIRED,
      },
      {
        label: t("products.productStatus.rejected"),
        value: ProductStatus.REJECTED,
      },
    ],
  };

  const dateFilters: Filter[] = [
    { label: t("fields.createdAt"), key: "created_at" },
    { label: t("fields.updatedAt"), key: "updated_at" },
  ].map((f) => ({
    key: f.key,
    label: f.label,
    type: "date",
  }));

  filters = [...filters, statusFilter, ...dateFilters];

  return filters;
};
