import { useParams } from "react-router-dom";

import { RouteFocusModal } from "../../../components/modals/index.ts";
import { useProductVariant } from "../../../hooks/api/products.tsx";
import { VARIANT_DETAIL_FIELDS } from "../product-variant-detail/constants.ts";
import { ManageVariantInventoryItemsForm } from "./components/manage-variant-inventory-items-form/index.ts";

export function ProductVariantManageInventoryItems() {
  const { id, variant_id } = useParams();

  const {
    variant,
    isPending: isLoading,
    isError,
    error,
  } = useProductVariant(id!, variant_id!, {
    fields: VARIANT_DETAIL_FIELDS,
  });

  if (isError) {
    throw error;
  }

  return (
    <RouteFocusModal>
      {!isLoading && variant && (
        <ManageVariantInventoryItemsForm variant={variant} />
      )}
    </RouteFocusModal>
  );
}
