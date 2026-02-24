import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

import { MagnifyingGlass } from "@medusajs/icons";
import { AdminOrder, AdminOrderPreview } from "@medusajs/types";
import { Button, Heading, Input, Text, toast } from "@medusajs/ui";

import debounce from "lodash/debounce";
import { useTranslation } from "react-i18next";

import {
  RouteFocusModal,
  StackedFocusModal,
  useStackedModal,
} from "../../../../../components/modals";
import { useAddOrderEditItems } from "../../../../../hooks/api/order-edits";
import { AddOrderEditItemsTable } from "../add-order-edit-items-table";
import { OrderEditItem } from "./order-edit-item";

type ExchangeInboundSectionProps = {
  order: AdminOrder;
  preview: AdminOrderPreview;
};

let addedVariants: string[] = [];

export const OrderEditItemsSection = ({
  order,
  preview,
}: ExchangeInboundSectionProps) => {
  const { t } = useTranslation();

  const { setIsOpen } = useStackedModal();
  const [filterTerm, setFilterTerm] = useState("");

  const { mutateAsync: addItems, isPending } = useAddOrderEditItems(order.id);

  const onItemsSelected = async () => {
    await addItems(
      {
        items: addedVariants.map((i) => ({
          variant_id: i,
          quantity: 1,
        })),
      },
      {
        onError: (e) => {
          toast.error(e.message);
        },
      },
    );

    setIsOpen("inbound-items", false);
  };

  const debouncedOnChange = useCallback(
    debounce((e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      setFilterTerm(value);
    }, 500),
    [setFilterTerm],
  );

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const filteredItems = useMemo(() => {
    const lowerFilterTerm = filterTerm.toLowerCase();
    return preview.items.filter(
      (i) =>
        i.title.toLowerCase().includes(filterTerm) ||
        i.product_title?.toLowerCase().includes(filterTerm),
    );
  }, [preview, filterTerm]);

  return (
    <div data-testid="order-edit-items-section">
      <div className="mb-3 mt-8 flex items-center justify-between" data-testid="order-edit-items-section-header">
        <Heading level="h2" data-testid="order-edit-items-section-heading">{t("fields.items")}</Heading>

        <div className="flex gap-2" data-testid="order-edit-items-section-actions">
          <Input
            onChange={debouncedOnChange}
            placeholder={t("fields.search")}
            autoComplete="off"
            type="search"
            data-testid="order-edit-items-section-search-input"
          />

          <StackedFocusModal id="inbound-items">
            <StackedFocusModal.Trigger asChild>
              <Button variant="secondary" size="small" data-testid="order-edit-items-section-add-items-button">
                {t("actions.addItems")}
              </Button>
            </StackedFocusModal.Trigger>

            <StackedFocusModal.Content>
              <StackedFocusModal.Header data-testid="order-edit-items-section-add-items-modal-header" />

              <AddOrderEditItemsTable
                currencyCode={order.currency_code}
                onSelectionChange={(finalSelection) => {
                  addedVariants = finalSelection;
                }}
              />

              <StackedFocusModal.Footer data-testid="order-edit-items-section-add-items-modal-footer">
                <div className="flex w-full items-center justify-end gap-x-4" data-testid="order-edit-items-section-add-items-modal-footer-actions">
                  <div className="flex items-center justify-end gap-x-2">
                    <RouteFocusModal.Close asChild>
                      <Button type="button" variant="secondary" size="small" data-testid="order-edit-items-section-add-items-modal-cancel-button">
                        {t("actions.cancel")}
                      </Button>
                    </RouteFocusModal.Close>
                    <Button
                      key="submit-button"
                      type="submit"
                      variant="primary"
                      size="small"
                      role="button"
                      disabled={isPending}
                      onClick={async () => await onItemsSelected()}
                      data-testid="order-edit-items-section-add-items-modal-save-button"
                    >
                      {t("actions.save")}
                    </Button>
                  </div>
                </div>
              </StackedFocusModal.Footer>
            </StackedFocusModal.Content>
          </StackedFocusModal>
        </div>
      </div>

      {filteredItems.map((item) => (
        <OrderEditItem
          key={item.id}
          item={item}
          orderId={order.id}
          currencyCode={order.currency_code}
        />
      ))}

      {filterTerm && !filteredItems.length && (
        <div className="flex flex-col items-center justify-center gap-y-2 rounded-xl bg-ui-bg-subtle p-3 text-center shadow-elevation-card-rest">
          <MagnifyingGlass className="text-ui-fg-subtle" />
          <Text size="small" leading="compact" weight="plus">
            {t("general.noSearchResults")}
          </Text>
        </div>
      )}
    </div>
  );
};
