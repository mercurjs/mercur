import { AdminPostShippingOptionsReq, Region } from "@medusajs/medusa";

import { ShippingOptionFormType } from ".";

export const useShippingOptionFormData = (
  regionId: string,
  isReturn = false
) => {
  const getRequirementsData = (data: ShippingOptionFormType) => {
    const requirements = Object.entries(data.requirements).reduce(
      (acc, [key, value]) => {
        if (typeof value?.amount === "number" && value.amount >= 0) {
          acc.push({
            type: key,
            amount: value.amount,
            id: value.id || undefined,
          });
          return acc;
        } else {
          return acc;
        }
      },
      [] as { type: string; amount: number; id?: string }[]
    );

    return requirements;
  };

  const getShippingOptionData = (
    data: ShippingOptionFormType,
    region: Region,
    isReturn = false
  ) => {
    const payload: AdminPostShippingOptionsReq = {
      is_return: false,
      region_id: region.id,
      profile_id: data.shipping_profile?.value,
      name: data.name!,
      data: {
        id: "manual-fulfillment",
      },
      price_type: data.price_type!.value,
      provider_id: "manual",
      admin_only: false,
      amount: data.amount!,
      requirements: getRequirementsData(data),
    };

    if (isReturn) {
      payload.is_return = true;
      payload.price_type = "flat_rate";
    }

    return { payload };
  };

  return {
    getRequirementsData,
    getShippingOptionData,
  };
};
