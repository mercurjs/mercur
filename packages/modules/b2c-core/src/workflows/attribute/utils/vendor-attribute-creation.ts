import { MedusaContainer } from "@medusajs/framework/types";
import { AttributeUIComponent, VendorAttributeInput } from "@mercurjs/framework";
import { createVendorProductAttributeWorkflow } from "../../vendor-product-attribute/workflows";

export const createVendorAttributes = async (
  vendorAttr: VendorAttributeInput,
  product_id: string,
  sellerId: string,
  container: MedusaContainer
) => {
  const creationPromises = vendorAttr.values.map((value) =>
    createVendorProductAttributeWorkflow(container).run({
      input: {
        title: vendorAttr.title,
        value,
        product_id,
        seller_id: sellerId,
        ui_component:
          (vendorAttr.ui_component as AttributeUIComponent) ??
          AttributeUIComponent.TEXTAREA,
        extends_attribute_id: vendorAttr.extends_attribute_id,
      },
    })
  );

  await Promise.all(creationPromises);
};
