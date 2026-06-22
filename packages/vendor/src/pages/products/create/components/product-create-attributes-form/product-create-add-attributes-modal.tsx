import { ProductAttributeDTO } from "@mercurjs/types";
import { Badge, Button, Checkbox, Tooltip } from "@medusajs/ui";
import {
  OnChangeFn,
  RowSelectionState,
  createColumnHelper,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData } from "@tanstack/react-query";

import { Filter } from "@components/table/data-table";
import { _DataTable } from "@components/table/data-table/data-table";
import { StackedFocusModal, useStackedModal } from "@components/modals";
import { useTabbedForm } from "@components/tabbed-form/tabbed-form";
import { useProductAttributes } from "@hooks/api";
import { useDataTable } from "@hooks/use-data-table";
import { useAttributeTableQuery } from "@hooks/table/query/use-attribute-table-query";
import { useDateTableFilters } from "@hooks/table/filters/use-date-table-filters";

import { ProductCreateSchemaType } from "../../types";
import { mergeSelectedAttributes } from "./attribute-merge";

export const ADD_ATTRIBUTES_MODAL_ID = "add-attributes";
const PAGE_SIZE = 20;
const MAX_VISIBLE_VALUES = 2;

const ATTRIBUTE_TYPE_LABELS: Record<string, string> = {
  single_select: "attributes.type.select",
  multi_select: "attributes.type.multivalue",
  unit: "attributes.type.unit",
  toggle: "attributes.type.toggle",
  text: "attributes.type.text_area",
};

// Highlight rows based on the state of their select checkbox:
// - required (preselected, disabled): subtle grey
// - selected (user-checked, enabled): highlight (light blue)
const ROW_HIGHLIGHT_CLASSES = [
  "[&_tr:has(button[role=checkbox][data-state=checked]:not([disabled]))>td]:!bg-ui-bg-highlight",
  "[&_tr:has(button[role=checkbox][data-state=checked][disabled])>td]:!bg-ui-bg-subtle",
].join(" ");

type SelectedAttribute = {
  id: string;
  name: string;
  values: string[];
  is_variant_axis: boolean;
  type: string;
  available_values: { id: string; name: string }[];
};

export const ProductCreateAddAttributesModal = () => {
  const form = useTabbedForm<ProductCreateSchemaType>();
  const { t } = useTranslation();
  const { getValues, setValue } = form;
  const { setIsOpen, getIsOpen } = useStackedModal();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [state, setState] = useState<SelectedAttribute[]>([]);

  const { searchParams, raw } = useAttributeTableQuery({
    pageSize: PAGE_SIZE,
    prefix: ADD_ATTRIBUTES_MODAL_ID,
  });
  const { product_attributes, count, isLoading, isError, error } =
    useProductAttributes(searchParams, {
      placeholderData: keepPreviousData,
    });

  const open = getIsOpen(ADD_ATTRIBUTES_MODAL_ID);

  useEffect(() => {
    if (!open) {
      return;
    }

    const attributes = getValues("attributes") ?? [];
    const existing = attributes.filter((a) => a.attribute_id);

    const selection: RowSelectionState = {};
    const stateEntries: SelectedAttribute[] = [];

    for (const a of existing) {
      if (a.attribute_id) {
        selection[a.attribute_id] = true;
        const apiAttr = product_attributes?.find(
          (pa: any) => pa.id === a.attribute_id,
        );
        stateEntries.push({
          id: a.attribute_id,
          name: a.title,
          values: Array.isArray(a.values)
            ? a.values
            : a.values
              ? [a.values]
              : [],
          is_variant_axis: a.use_for_variants,
          type: a.type ?? apiAttr?.type ?? "",
          available_values:
            a.available_values ??
            apiAttr?.values?.map((v: any) => ({ id: v.id, name: v.name })) ??
            [],
        });
      }
    }

    if (product_attributes) {
      for (const attr of product_attributes) {
        if (attr.is_required && !selection[attr.id]) {
          selection[attr.id] = true;
          stateEntries.push({
            id: attr.id,
            name: attr.name,
            values: [],
            is_variant_axis: attr.is_variant_axis,
            type: attr.type,
            available_values:
              attr.values?.map((v: any) => ({ id: v.id, name: v.name })) ?? [],
          });
        }
      }
    }

    setRowSelection(selection);
    setState(stateEntries);
  }, [open, getValues, product_attributes]);

  const applySelectionChange = (next: RowSelectionState) => {
    if (product_attributes) {
      for (const attr of product_attributes) {
        if (attr.is_required) {
          next[attr.id] = true;
        }
      }
    }

    const ids = Object.keys(next);

    const addedIdsSet = new Set(
      ids.filter((id) => next[id] && !rowSelection[id]),
    );

    let addedAttributes: SelectedAttribute[] = [];

    if (addedIdsSet.size > 0) {
      addedAttributes =
        product_attributes
          ?.filter((attr: any) => addedIdsSet.has(attr.id))
          .map((attr: any) => ({
            id: attr.id,
            name: attr.name,
            values: [],
            is_variant_axis: attr.is_variant_axis,
            type: attr.type,
            available_values:
              attr.values?.map((v: any) => ({ id: v.id, name: v.name })) ?? [],
          })) ?? [];
    }

    setState((prev) => {
      const filteredPrev = prev.filter((a) => next[a.id]);
      return Array.from(new Set([...filteredPrev, ...addedAttributes]));
    });
    setRowSelection(next);
  };

  const onRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    const next =
      typeof updater === "function" ? updater(rowSelection) : updater;
    applySelectionChange({ ...next });
  };

  const handleAdd = () => {
    const currentAttributes = getValues("attributes") ?? [];

    const requiredIds = new Set(
      product_attributes
        ?.filter((a: any) => a.is_required)
        .map((a: any) => a.id) ?? [],
    );

    const selectedAttributes = state.map((a) => ({
      attribute_id: a.id,
      title: a.name,
      values: a.values,
      is_custom: false,
      is_required: requiredIds.has(a.id),
      use_for_variants: a.is_variant_axis,
      type: a.type,
      available_values: a.available_values,
    }));

    // MER-183: apply the selection without reordering the array. Keeping
    // custom (and still-selected) entries in their original positions avoids
    // desyncing the live form values from the `useFieldArray` snapshot, which
    // is what crossed the toggle/value rendering and wiped values.
    setValue(
      "attributes",
      mergeSelectedAttributes(currentAttributes, selectedAttributes),
      {
        shouldDirty: true,
        shouldTouch: true,
      },
    );
    setIsOpen(ADD_ATTRIBUTES_MODAL_ID, false);
  };

  const dateFilters = useDateTableFilters();
  const filters = useMemo<Filter[]>(
    () => [
      {
        key: "is_filterable",
        label: t("attributes.fields.filterable"),
        type: "select",
        options: [
          { label: t("filters.radio.yes"), value: "true" },
          { label: t("filters.radio.no"), value: "false" },
        ],
      },
      ...dateFilters,
    ],
    [t, dateFilters],
  );
  const columns = useColumns();

  const { table } = useDataTable({
    data: product_attributes ?? [],
    columns,
    count,
    pageSize: PAGE_SIZE,
    prefix: ADD_ATTRIBUTES_MODAL_ID,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    rowSelection: {
      state: rowSelection,
      updater: onRowSelectionChange,
    },
    enablePagination: true,
  });

  if (isError) {
    throw error;
  }

  return (
    <StackedFocusModal.Content className="flex flex-col overflow-hidden">
      <StackedFocusModal.Header />
      <StackedFocusModal.Body
        className={`flex-1 overflow-hidden ${ROW_HIGHLIGHT_CLASSES}`}
        data-testid="product-create-add-attributes-table"
      >
        <_DataTable
          table={table}
          columns={columns}
          filters={filters}
          count={count}
          pageSize={PAGE_SIZE}
          queryObject={raw}
          isLoading={isLoading}
          layout="fill"
          prefix={ADD_ATTRIBUTES_MODAL_ID}
          pagination
          search="autofocus"
          orderBy={[
            { key: "name", label: t("attributes.fields.name") },
            { key: "created_at", label: t("fields.createdAt") },
            { key: "updated_at", label: t("fields.updatedAt") },
          ]}
          noRecords={{
            title: t("products.create.attributes.noAttributesTitle"),
            message: t("products.create.attributes.noAttributesDescription"),
          }}
        />
      </StackedFocusModal.Body>
      <StackedFocusModal.Footer>
        <div className="flex items-center justify-end gap-x-2">
          <StackedFocusModal.Close asChild>
            <Button size="small" variant="secondary" type="button">
              {t("actions.cancel")}
            </Button>
          </StackedFocusModal.Close>
          <Button size="small" onClick={handleAdd} type="button">
            {t("actions.save")}
          </Button>
        </div>
      </StackedFocusModal.Footer>
    </StackedFocusModal.Content>
  );
};

const columnHelper = createColumnHelper<ProductAttributeDTO>();

const useColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => {
          const isRequired = (row.original as any).is_required;
          const checkbox = (
            <Checkbox
              onClick={(e) => e.stopPropagation()}
              checked={row.getIsSelected() || isRequired}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              disabled={isRequired}
            />
          );

          // Required attributes can't be deselected — explain via tooltip.
          if (isRequired) {
            return (
              <Tooltip
                content={t("products.create.attributes.requiredTooltip")}
              >
                <span className="inline-flex">{checkbox}</span>
              </Tooltip>
            );
          }

          return checkbox;
        },
      }),
      columnHelper.accessor("name", {
        header: t("attributes.fields.name"),
        enableSorting: false,
      }),
      columnHelper.accessor("handle", {
        header: t("attributes.fields.handle"),
        cell: (info: any) => {
          const handle = info.getValue();
          return handle ? `/${handle}` : "-";
        },
        enableSorting: false,
      }),
      columnHelper.accessor("is_required", {
        header: t("attributes.fields.required"),
        cell: (info: any) => {
          if (info.getValue()) {
            return (
              <Tooltip
                content={t("products.create.attributes.requiredTooltip")}
              >
                <span className="cursor-help underline decoration-dotted underline-offset-2">
                  {t("filters.radio.yes")}
                </span>
              </Tooltip>
            );
          }
          return t("filters.radio.no");
        },
        enableSorting: false,
      }),
      columnHelper.accessor("type", {
        header: t("attributes.fields.type"),
        cell: (info: any) => {
          const type = info.getValue();
          const labelKey = ATTRIBUTE_TYPE_LABELS[type];
          return labelKey ? t(labelKey) : type;
        },
        enableSorting: false,
      }),
      columnHelper.accessor("is_variant_axis", {
        header: t("attributes.fields.variantAxis"),
        cell: (info: any) =>
          info.getValue() ? t("filters.radio.yes") : t("filters.radio.no"),
        enableSorting: false,
      }),
      columnHelper.display({
        id: "values",
        header: t("attributes.fields.values"),
        cell: ({ row }: any) => {
          const values = row.original.values ?? [];
          if (!values.length) {
            return <span className="text-ui-fg-muted">-</span>;
          }
          const visible = values.slice(0, MAX_VISIBLE_VALUES);
          const remaining = values.length - MAX_VISIBLE_VALUES;
          return (
            <div className="flex items-center gap-x-1">
              {visible.map((v: any) => (
                <Badge key={v.id} size="2xsmall" color="grey">
                  {v.name}
                </Badge>
              ))}
              {remaining > 0 && (
                <Badge size="2xsmall" color="grey">
                  +{remaining}
                </Badge>
              )}
            </div>
          );
        },
      }),
    ],
    [t],
  );
};
