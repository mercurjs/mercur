import { useLoaderData, useParams } from "react-router-dom";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import { LayoutComposer } from "@mercurjs/dashboard-shared";
import { useShippingProfile } from "@hooks/api/shipping-profiles";

import { ShippingProfileGeneralSection } from "./_components/shipping-profile-general-section";

import type { shippingProfileLoader } from "./loader";

export const ShippingProfileDetailPage = () => {
  const { shipping_profile_id } = useParams();

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof shippingProfileLoader>
  >;

  const { shipping_profile, isLoading, isError, error } = useShippingProfile(
    shipping_profile_id!,
    undefined,
    {
      initialData,
    },
  );

  if (isLoading || !shipping_profile) {
    return <SingleColumnPageSkeleton sections={1} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="shipping-profiles.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={shipping_profile}
      sections={{
        main: (
          <LayoutComposer.Entry id="ShippingProfileGeneralSection">
            <ShippingProfileGeneralSection profile={shipping_profile} />
          </LayoutComposer.Entry>
        ),
      }}
    />
  );
};
