import { useTranslation } from "react-i18next";
import { Container, Heading, Text } from "@medusajs/ui";

import { Thumbnail } from "@components/common/thumbnail";
import { useOrderPreview } from "@hooks/api/orders";
import type { VendorReturnRequest } from "@hooks/api/return-requests";

type ItemRow = {
  id: string;
  title: string;
  variant_title?: string | null;
  thumbnail?: string | null;
  quantity: number;
  reason?: string | null;
  note?: string | null;
};

// Return items only exist once the request is accepted. While it is pending they
// live as RETURN_ITEM actions on the order change, which the preview exposes.
const usePendingItems = (returnRequest: VendorReturnRequest): ItemRow[] => {
  const { order: preview } = useOrderPreview(returnRequest.order_id, undefined, {
    enabled: returnRequest.status === "pending",
  });

  if (!preview?.order_change?.actions) {
    return [];
  }

  return preview.order_change.actions
    .filter(
      (action) =>
        action.action === "RETURN_ITEM" &&
        action.return_id === returnRequest.return_id,
    )
    .map((action) => {
      const details = (action.details ?? {}) as {
        reference_id?: string;
        quantity?: number;
        reason_id?: string;
      };
      const item = preview.items.find((i) => i.id === details.reference_id);

      return {
        id: action.id,
        title: item?.title ?? details.reference_id ?? "-",
        variant_title: item?.variant_title,
        thumbnail: item?.thumbnail,
        quantity: details.quantity ?? 0,
        reason: null,
        note: action.internal_note,
      };
    });
};

export const ReturnRequestItemsSection = ({
  returnRequest,
}: {
  returnRequest: VendorReturnRequest;
}) => {
  const { t } = useTranslation();
  const pendingItems = usePendingItems(returnRequest);

  const confirmedItems: ItemRow[] = (returnRequest.return?.items ?? []).map(
    (returnItem) => ({
      id: returnItem.id,
      title: returnItem.item?.title ?? "-",
      variant_title: returnItem.item?.variant_title,
      thumbnail: returnItem.item?.thumbnail,
      quantity: Number(returnItem.quantity),
      reason: returnItem.reason?.label,
      note: returnItem.note,
    }),
  );

  const items = confirmedItems.length ? confirmedItems : pendingItems;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("returnRequests.detail.items")}</Heading>
      </div>
      {items.length === 0 ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            {t("returnRequests.detail.noItems")}
          </Text>
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="text-ui-fg-subtle grid grid-cols-[auto_1fr_auto] items-center gap-x-4 px-6 py-4"
          >
            <Thumbnail src={item.thumbnail} />
            <div className="flex flex-col">
              <Text size="small" leading="compact" weight="plus">
                {item.title}
              </Text>
              {item.variant_title && (
                <Text size="small" leading="compact">
                  {item.variant_title}
                </Text>
              )}
              {(item.reason || item.note) && (
                <Text size="small" leading="compact">
                  {[item.reason, item.note].filter(Boolean).join(" · ")}
                </Text>
              )}
            </div>
            <Text size="small" leading="compact">
              x{item.quantity}
            </Text>
          </div>
        ))
      )}
    </Container>
  );
};
