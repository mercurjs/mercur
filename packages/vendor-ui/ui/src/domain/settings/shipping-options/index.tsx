import { useTranslation } from "react-i18next";
import Section from "../../../components/organisms/section";
import useToggleState from "../../../hooks/use-toggle-state";

import BackButton from "../../../components/atoms/back-button";
import RegionOverview from "./region-overview";
import { useParams } from "react-router-dom";
import { useAdminRegion, useAdminShippingOptions } from "medusa-react";
import ShippingOptionCard from "./shipping-option-card";
import CreateShippingOptionModal from "./create-shipping-option-modal";

const ShippingOptions = () => {
  const params = useParams();
  const regId: string | undefined = params["*"];
  const { t } = useTranslation();
  const { state, toggle, close } = useToggleState();

  const { region } = useAdminRegion(regId!);

  const { shipping_options: shippingOptions } = useAdminShippingOptions({
    region_id: regId,
    is_return: false,
  });

  return (
    <div>
      <BackButton
        path="/a/settings"
        label="Back to Settings"
        className="mb-xsmall"
      />
      <div className="flex flex-col large:flex-row gap-3 large:gap-2 h-[100%] w-[100%]">
        <RegionOverview id={regId} />
        <Section
          title={t("shipping-options-shipping-options", "Shipping Options")}
          actions={[
            {
              label: t("shipping-options-add-option", "Add Option"),
              onClick: toggle,
            },
          ]}
          className="flex flex-col gap-3 large:gap-y-2xsmall w-full"
        >
          <div className="gap-y-large flex flex-col">
            <p className="inter-base-regular text-grey-50">
              {t(
                "shipping-options-enter-specifics-about-available-regional-shipment-methods",
                "Enter specifics about available shipment methods."
              )}
            </p>
            <div className="gap-y-small flex flex-col">
              {shippingOptions?.map((option) => {
                return <ShippingOptionCard option={option} key={option.id} />;
              })}
            </div>
          </div>
        </Section>
        <CreateShippingOptionModal
          open={state}
          onClose={close}
          region={region!}
        />
      </div>
    </div>
  );
};

export default ShippingOptions;
