import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAdminRegions } from "medusa-react";
import RadioGroup from "../../../../components/organisms/radio-group";
import Section from "../../../../components/organisms/section";
import { useAnalytics } from "../../../../providers/analytics-provider";

import RegionCard from "./region-card";

type Props = {
  id?: string;
};

const RegionOverview = ({ id }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trackRegions } = useAnalytics();
  const { regions } = useAdminRegions(undefined, {
    onSuccess: ({ regions, count }) => {
      trackRegions({ regions: regions.map((r) => r.name), count });
    },
  });
  const [selectedRegion, setSelectedRegion] = React.useState<
    string | undefined
  >(id);

  const handleChange = useCallback(
    (id: string) => {
      if (id !== selectedRegion) {
        setSelectedRegion(id);
        navigate(`/a/settings/shipping-options/${id}`, {
          replace: true,
        });
      }
    },
    [navigate, selectedRegion]
  );

  useEffect(() => {
    if (id) {
      handleChange(id);
    }

    if (!id && regions && regions.length > 0) {
      handleChange(regions[0].id);
    }
  }, [handleChange, id, regions]);

  return (
    <>
      <Section
        title={t("region-overview-regions", "Regions")}
        className="h-auto min-w-[400px]"
      >
        <p className="text-base-regular text-grey-50 mt-2xsmall">
          {t(
            "region-overview-manage-the-markets-that-you-will-operate-within",
            "Manage the markets that you will operate within."
          )}
        </p>
        <div className="mt-large">
          <RadioGroup.Root value={selectedRegion} onValueChange={handleChange}>
            {regions?.map((region) => (
              <RegionCard key={region.id} region={region} />
            ))}
          </RadioGroup.Root>
        </div>
      </Section>
    </>
  );
};

export default RegionOverview;
