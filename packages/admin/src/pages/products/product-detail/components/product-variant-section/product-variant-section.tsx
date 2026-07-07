import { useCallback, useMemo } from "react";

import { PencilSquare, Trash } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import { ProductDTO, ProductVariantDTO } from "@mercurjs/types";
import { DisplayExtensionZone } from "@mercurjs/dashboard-shared";
import {
  Badge,
  Button,
  Container,
  Heading,
  toast,
  Tooltip,
  usePrompt,
} from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { ActionMenu } from "../../../../../components/common/action-menu";
import { Thumbnail } from "../../../../../components/common/thumbnail";
import { _DataTable, Filter } from "../../../../../components/table/data-table";
import { DataTableOrderByKey } from "../../../../../components/table/data-table/data-table-order-by";
import {
  useDeleteVariantLazy,
  useProductVariants,
} from "../../../../../hooks/api/products";
import { useDataTable } from "../../../../../hooks/use-data-table";
import { useQueryParams } from "../../../../../hooks/use-query-params";

const PAGE_SIZE = 10;
const PREFIX = "pv";

export const ProductVariantSection = ({
  product,
}: {
  product: HttpTypes.AdminProduct;
}) => {
  const { t } = useTranslation();

  const { q, order, offset, created_at, updated_at } = useQueryParams(
    ["q", "order", "offset", "created_at", "updated_at"],
    PREFIX,
  );

  const { variants, count, isLoading, isError, error } = useProductVariants(
    product.id,
    {
      q,
      order: order ? order : "variant_rank",
      offset: offset ? parseInt(offset) : undefined,
      limit: PAGE_SIZE,
      created_at: created_at ? JSON.parse(created_at) : undefined,
      updated_at: updated_at ? JSON.parse(updated_at) : undefined,
      fields: "title,sku,created_at,updated_at,*options,*options.option",
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  const columns = useColumns(product);
  const filters = useFilters();
  const orderBy = useOrderBy();

  const { table } = useDataTable({
    data: variants ?? [],
    columns,
    count,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row.id,
    prefix: PREFIX,
  });

  if (isError) {
    throw error;
  }

  return (
    <Container className="divide-y p-0" data-testid="product-variant-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.variants.header")}</Heading>
        <Button
          size="small"
          variant="secondary"
          asChild
          data-testid="product-variants-create-button"
        >
          <Link to="variants/create">{t("actions.create")}</Link>
        </Button>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={count}
        pageSize={PAGE_SIZE}
        filters={filters}
        search
        pagination
        isLoading={isLoading}
        orderBy={orderBy}
        prefix={PREFIX}
        queryObject={{ q, order, created_at, updated_at }}
        navigateTo={(row) => `variants/${row.original.id}`}
        noRecords={{
          title: t("products.variants.empty.heading"),
          message: t("products.variants.empty.description"),
        }}
      />
      <DisplayExtensionZone model="product" zone="variants" data={product} />
    </Container>
  );
};

const columnHelper = createColumnHelper<ProductVariantDTO>();

const useColumns = (product: HttpTypes.AdminProduct) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync } = useDeleteVariantLazy(product.id);
  const prompt = usePrompt();
  const [searchParams] = useSearchParams();

  const tableSearchParams = useMemo(() => {
    const filtered = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith(`${PREFIX}_`)) {
        filtered.append(key, value);
      }
    }
    return filtered;
  }, [searchParams]);

  const handleDelete = useCallback(
    async (id: string, title: string) => {
      const res = await prompt({
        title: t("general.areYouSure"),
        description: t("products.deleteVariantWarning", {
          title,
        }),
        confirmText: t("actions.delete"),
        cancelText: t("actions.cancel"),
      });

      if (!res) {
        return;
      }

      await mutateAsync(
        { variantId: id },
        {
          onError: (error) => {
            toast.error(error.message);
          },
        },
      );
    },
    [mutateAsync, prompt, t],
  );

  // Under SPEC-008 the variant table surfaces only axis attributes.
  // Stock Medusa stores the per-variant value as a ProductOptionValue
  // on `variant.options[]` (keyed by `option.title`, which the wrapper
  // synthesizes from the attribute name). Read from there.
  const attributeColumns = useMemo(() => {
    const variantAttributes = (
      product as HttpTypes.AdminProduct & Pick<ProductDTO, "attributes">
    )?.attributes?.filter((attr) => attr.is_variant_axis);

    if (!variantAttributes?.length) {
      return [];
    }

    return variantAttributes.map((attribute) => {
      return columnHelper.display({
        id: `attribute-${attribute.id}`,
        header: attribute.name,
        cell: ({ row }) => {
          const variantOpt = row.original.options?.find(
            (opt) => opt.option?.title === attribute.name,
          );

          if (!variantOpt?.value) {
            return <span className="text-ui-fg-muted">-</span>;
          }

          return (
            <div
              className="flex flex-wrap items-center gap-1"
              data-testid={`product-variant-attribute-${attribute.id}-${row.original.id}`}
            >
              <Tooltip content={variantOpt.value}>
                <Badge
                  size="2xsmall"
                  title={variantOpt.value}
                  className="inline-flex min-w-[20px] max-w-[140px] items-center justify-center overflow-hidden truncate"
                  data-testid={`product-variant-attribute-badge-${attribute.id}-${row.original.id}-${variantOpt.value}`}
                >
                  {variantOpt.value}
                </Badge>
              </Tooltip>
            </div>
          );
        },
      });
    });
  }, [product]);

  return useMemo(
    () => [
      columnHelper.accessor("title", {
        id: "title",
        header: t("fields.title"),
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <div className="flex h-full w-full max-w-[250px] items-center gap-x-3 overflow-hidden">
              <div className="w-fit flex-shrink-0">
                <Thumbnail src={product.thumbnail} />
              </div>
              {value ? (
                <span title={value} className="truncate">
                  {value}
                </span>
              ) : (
                <span className="text-ui-fg-muted">-</span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("sku", {
        id: "sku",
        header: t("fields.sku"),
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? value : <span className="text-ui-fg-muted">-</span>;
        },
      }),
      ...attributeColumns,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    icon: <PencilSquare />,
                    label: t("actions.edit"),
                    onClick: () =>
                      navigate(
                        `edit-variant?variant_id=${row.original.id}&${tableSearchParams.toString()}`,
                        {
                          state: {
                            restore_params: tableSearchParams.toString(),
                          },
                        },
                      ),
                  },
                ],
              },
              {
                actions: [
                  {
                    icon: <Trash />,
                    label: t("actions.delete"),
                    onClick: () =>
                      handleDelete(row.original.id, row.original.title ?? ""),
                  },
                ],
              },
            ]}
          />
        ),
      }),
    ],
    [t, attributeColumns, navigate, handleDelete, tableSearchParams, product],
  );
};

const useFilters = (): Filter[] => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      { key: "created_at", label: t("fields.createdAt"), type: "date" },
      { key: "updated_at", label: t("fields.updatedAt"), type: "date" },
    ],
    [t],
  );
};

const useOrderBy = (): DataTableOrderByKey<ProductVariantDTO>[] => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      { key: "title", label: t("fields.title") },
      { key: "sku", label: t("fields.sku") },
    ],
    [t],
  );
};
