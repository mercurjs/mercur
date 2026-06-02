import { useCallback, useMemo } from "react";

import { PencilSquare, Trash } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import { ProductDTO } from "@mercurjs/types";
import {
  Badge,
  Container,
  createDataTableColumnHelper,
  DataTableAction,
  Tooltip,
  usePrompt,
} from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { CellContext } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import { DataTable } from "../../../../../components/data-table";
import { useDataTableDateColumns } from "../../../../../components/data-table/helpers/general/use-data-table-date-columns";
import { useDataTableDateFilters } from "../../../../../components/data-table/helpers/general/use-data-table-date-filters";
import {
  useDeleteVariantLazy,
  useProductVariants,
} from "../../../../../hooks/api/products";
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

  const columns = useColumns(product);
  const filters = useFilters();

  const { variants, count, isPending, isError, error } = useProductVariants(
    product.id,
    {
      q,
      order: order ? order : "variant_rank",
      offset: offset ? parseInt(offset) : undefined,
      limit: PAGE_SIZE,
      created_at: created_at ? JSON.parse(created_at) : undefined,
      updated_at: updated_at ? JSON.parse(updated_at) : undefined,
      fields:
        "title,created_at,updated_at,*options,*options.option",
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  if (isError) {
    throw error;
  }

  return (
    <Container className="divide-y p-0" data-testid="product-variant-section">
      <div data-testid="product-variants-table-container">
        <DataTable
          data={variants}
          columns={columns}
          filters={filters}
          rowCount={count}
          getRowId={(row) => row.id}
          rowHref={(row) => `/products/${product.id}/variants/${row.id}`}
          pageSize={PAGE_SIZE}
          isLoading={isPending}
          heading={t("products.variants.header")}
          emptyState={{
            empty: {
              heading: t("products.variants.empty.heading"),
              description: t("products.variants.empty.description"),
            },
            filtered: {
              heading: t("products.variants.filtered.heading"),
              description: t("products.variants.filtered.description"),
            },
          }}
          action={{
            label: t("actions.create"),
            to: `variants/create`,
          }}
          prefix={PREFIX}
        />
      </div>
    </Container>
  );
};

const columnHelper =
  createDataTableColumnHelper<HttpTypes.AdminProductVariant>();

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

  const dateColumns = useDataTableDateColumns<HttpTypes.AdminProductVariant>();

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

      await mutateAsync({ variantId: id });
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

  const getActions = useCallback(
    (ctx: CellContext<HttpTypes.AdminProductVariant, unknown>) => {
      const variant = ctx.row.original;

      const mainActions: DataTableAction<HttpTypes.AdminProductVariant>[] = [
        {
          icon: <PencilSquare />,
          label: t("actions.edit"),
          onClick: (row) => {
            navigate(
              `edit-variant?variant_id=${row.row.original.id}&${tableSearchParams.toString()}`,
              {
                state: {
                  restore_params: tableSearchParams.toString(),
                },
              },
            );
          },
        },
      ];

      const secondaryActions: DataTableAction<HttpTypes.AdminProductVariant>[] =
        [
          {
            icon: <Trash />,
            label: t("actions.delete"),
            onClick: () => handleDelete(variant.id, variant.title!),
          },
        ];

      return [mainActions, secondaryActions];
    },
    [handleDelete, navigate, t, tableSearchParams],
  );

  return useMemo(() => {
    return [
      columnHelper.accessor("title", {
        header: t("fields.title"),
        enableSorting: true,
        sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
        sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
      }),
      ...attributeColumns,
      ...dateColumns,
      columnHelper.action({
        actions: getActions,
      }),
    ];
  }, [t, attributeColumns, dateColumns, getActions]);
};

const useFilters = () => {
  const dateFilters = useDataTableDateFilters();

  return useMemo(() => {
    return [
      ...dateFilters,
    ];
  }, [dateFilters]);
};
