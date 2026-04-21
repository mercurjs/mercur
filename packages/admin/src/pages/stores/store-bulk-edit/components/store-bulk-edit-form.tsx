import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Button, toast } from "@medusajs/ui";

import {
  DataGrid,
  createDataGridHelper,
} from "@components/data-grid";
import { RouteFocusModal, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import { sdk } from "@lib/client";
import { queryClient } from "@lib/query-client";
import { sellersQueryKeys, useSellers } from "@hooks/api/sellers";
import { SellerDTO, SellerStatus } from "@mercurjs/types";

type FormValues = {
  statuses: Record<string, SellerStatus>;
};

const helper = createDataGridHelper<SellerDTO, FormValues>();

const useColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      helper.column({
        id: "name",
        name: t("fields.name"),
        header: t("fields.name"),
        cell: (context) => (
          <DataGrid.ReadonlyCell context={context} color="normal">
            {context.row.original.name}
          </DataGrid.ReadonlyCell>
        ),
        disableHiding: true,
      }),
      helper.column({
        id: "status",
        name: t("fields.status"),
        header: t("fields.status"),
        type: "select",
        field: (context) =>
          `statuses.${context.row.original.id}` as const,
        cell: (context) => (
          <DataGrid.SelectCell
            context={context}
            options={[
              {
                label: t("stores.status.open"),
                value: SellerStatus.OPEN,
              },
              {
                label: t("stores.status.pendingApproval"),
                value: SellerStatus.PENDING_APPROVAL,
              },
              {
                label: t("stores.status.suspended"),
                value: SellerStatus.SUSPENDED,
              },
            ]}
          />
        ),
      }),
    ],
    [t],
  );
};

export const StoreBulkEditForm = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { handleSuccess, setCloseOnEscape } = useRouteModal();

  const ids = useMemo(
    () =>
      (searchParams.get("ids") ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    [searchParams],
  );

  const { sellers, isLoading } = useSellers(
    { id: ids, limit: ids.length || 1 },
    { enabled: ids.length > 0 },
  );

  const form = useForm<FormValues>({
    defaultValues: { statuses: {} },
  });

  useEffect(() => {
    if (sellers) {
      form.reset({
        statuses: Object.fromEntries(
          sellers.map((s) => [s.id, s.status as SellerStatus]),
        ),
      });
    }
  }, [sellers, form]);

  const columns = useColumns();

  const handleSubmit = form.handleSubmit(async ({ statuses }) => {
    if (!sellers) return;

    const updates = sellers
      .filter((seller) => statuses[seller.id] !== seller.status)
      .map((seller) =>
        sdk.admin.sellers.$id.mutate({
          $id: seller.id,
          status: statuses[seller.id],
        }),
      );

    if (!updates.length) {
      handleSuccess();
      return;
    }

    try {
      await Promise.all(updates);
      await queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.lists(),
      });
      toast.success(
        t("stores.bulkEdit.successToast", { count: updates.length }),
      );
      handleSuccess();
    } catch (error) {
      toast.error((error as Error).message);
    }
  });

  const { isSubmitting } = form.formState;

  return (
    <RouteFocusModal.Form form={form} data-testid="store-bulk-edit-form">
      <KeyboundForm onSubmit={handleSubmit} className="flex size-full flex-col">
        <RouteFocusModal.Header data-testid="store-bulk-edit-form-header" />
        <RouteFocusModal.Body
          className="flex flex-col overflow-hidden"
          data-testid="store-bulk-edit-form-body"
        >
          <DataGrid
            state={form}
            columns={columns}
            data={sellers ?? []}
            isLoading={isLoading}
            onEditingChange={(editing) => setCloseOnEscape(!editing)}
            disableInteractions={isSubmitting}
            data-testid="store-bulk-edit-data-grid"
          />
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="store-bulk-edit-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button
                size="small"
                variant="secondary"
                type="button"
                data-testid="store-bulk-edit-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isSubmitting}
              data-testid="store-bulk-edit-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};

export default StoreBulkEditForm;
