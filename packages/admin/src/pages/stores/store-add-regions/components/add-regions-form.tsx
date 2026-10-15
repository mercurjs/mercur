import { zodResolver } from "@hookform/resolvers/zod";
import type { HttpTypes } from "@medusajs/types";
import { Button, Checkbox, Hint, Tooltip, toast } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import {
  type OnChangeFn,
  type RowSelectionState,
  createColumnHelper,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { InferClientOutput } from "@mercurjs/client";
import { SellerRegionDTO } from "@mercurjs/types";
import { sdk } from "@lib/client";

import { RouteFocusModal, useRouteModal } from "../../../../components/modals";
import { _DataTable } from "../../../../components/table/data-table";
import { KeyboundForm } from "../../../../components/utilities/keybound-form";
import { useRegions } from "../../../../hooks/api/regions";
import { useBatchSellerRegions } from "../../../../hooks/api/sellers";
import { useRegionTableColumns } from "../../../../hooks/table/columns/use-region-table-columns";
import { useRegionTableQuery } from "../../../../hooks/table/query/use-region-table-query";
import { useDataTable } from "../../../../hooks/use-data-table";

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"];

type AddRegionsFormProps = {
  seller: Seller;
};

const AddRegionsSchema = zod.object({
  region_ids: zod.array(zod.string()).min(1),
});

const PAGE_SIZE = 50;
const PREFIX = "ar";

export const AddRegionsForm = ({ seller }: AddRegionsFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const assignedIds = useMemo(
    () => new Set(((seller.regions ?? []) as SellerRegionDTO[]).map((r) => r.id)),
    [seller.regions],
  );

  const form = useForm<zod.infer<typeof AddRegionsSchema>>({
    defaultValues: {
      region_ids: [],
    },
    resolver: zodResolver(AddRegionsSchema),
  });

  const { setValue } = form;

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const state = typeof fn === "function" ? fn(rowSelection) : fn;

    setValue("region_ids", Object.keys(state), {
      shouldDirty: true,
      shouldTouch: true,
    });

    setRowSelection(state);
  };

  const { searchParams, raw } = useRegionTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  const { regions, count, isPending, isError, error } = useRegions(
    { ...searchParams, fields: "id,name,currency_code,*countries,*payment_providers" },
    { placeholderData: keepPreviousData },
  );

  const columns = useColumns();

  const { table } = useDataTable({
    data: regions ?? [],
    columns,
    count: count ?? 0,
    enablePagination: true,
    enableRowSelection: (row) => !assignedIds.has(row.original.id),
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    rowSelection: {
      state: rowSelection,
      updater,
    },
    prefix: PREFIX,
    meta: {
      assignedIds,
    },
  });

  const { mutateAsync, isPending: isMutating } = useBatchSellerRegions(seller.id);

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      { add: values.region_ids },
      {
        onSuccess: () => {
          toast.success(t("stores.regions.toast.added"));
          handleSuccess();
        },
        onError: (e) => {
          toast.error(e.message);
        },
      },
    );
  });

  if (isError) {
    throw error;
  }

  return (
    <RouteFocusModal.Form form={form} data-testid="store-add-regions-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header data-testid="store-add-regions-form-header">
          <div className="flex items-center justify-end gap-x-2">
            {form.formState.errors.region_ids && (
              <Hint variant="error" data-testid="store-add-regions-form-error">
                {form.formState.errors.region_ids.message}
              </Hint>
            )}
          </div>
        </RouteFocusModal.Header>
        <RouteFocusModal.Body
          className="overflow-hidden"
          data-testid="store-add-regions-form-body"
        >
          <_DataTable
            table={table}
            columns={columns}
            pageSize={PAGE_SIZE}
            count={count ?? 0}
            isLoading={isPending}
            search="autofocus"
            pagination
            layout="fill"
            orderBy={[
              { key: "name", label: t("fields.name") },
              { key: "created_at", label: t("fields.createdAt") },
            ]}
            queryObject={raw}
            prefix={PREFIX}
            noRecords={{
              message: t("stores.regions.noRegionsToAdd"),
            }}
            data-testid="store-add-regions-form-table"
          />
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="store-add-regions-form-footer">
          <RouteFocusModal.Close asChild>
            <Button
              size="small"
              variant="secondary"
              data-testid="store-add-regions-form-cancel-button"
            >
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          <Button
            size="small"
            isLoading={isMutating}
            type="submit"
            data-testid="store-add-regions-form-add-button"
          >
            {t("actions.add")}
          </Button>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};

const columnHelper = createColumnHelper<HttpTypes.AdminRegion>();

const useColumns = () => {
  const { t } = useTranslation();
  const base = useRegionTableColumns();

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
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            data-testid="store-add-regions-form-select-all-checkbox"
          />
        ),
        cell: ({ row, table }) => {
          const { assignedIds } = table.options.meta as {
            assignedIds: Set<string>;
          };
          const assigned = assignedIds.has(row.original.id);

          const checkbox = (
            <Checkbox
              checked={row.getIsSelected() || assigned}
              disabled={assigned}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              onClick={(e) => {
                e.stopPropagation();
              }}
              data-testid={`store-add-regions-form-select-checkbox-${row.original.id}`}
            />
          );

          if (assigned) {
            return (
              <Tooltip content={t("stores.regions.alreadyAssigned")} side="right">
                {checkbox}
              </Tooltip>
            );
          }

          return checkbox;
        },
      }),
      ...base,
    ],
    [t, base],
  );
};
