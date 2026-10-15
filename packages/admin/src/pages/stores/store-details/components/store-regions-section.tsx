import { MapPin, PlusMini, Trash } from "@medusajs/icons";
import { Badge, Container, Heading, Text, toast, usePrompt } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { InferClientOutput } from "@mercurjs/client";
import { DisplayExtensionZone } from "@mercurjs/dashboard-shared";
import { SellerRegionDTO } from "@mercurjs/types";
import { sdk } from "@lib/client";

import { ActionMenu } from "../../../../components/common/action-menu";
import { IconAvatar } from "../../../../components/common/icon-avatar";
import { useBatchSellerRegions } from "../../../../hooks/api/sellers";

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"];

type StoreRegionsSectionProps = {
  seller: Seller;
};

export const StoreRegionsSection = ({ seller }: StoreRegionsSectionProps) => {
  const { t } = useTranslation();
  const regions = (seller.regions ?? []) as SellerRegionDTO[];

  return (
    <Container className="divide-y p-0" data-testid="store-regions-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("stores.regions.header")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("stores.regions.add"),
                  icon: <PlusMini />,
                  to: `/stores/${seller.id}/regions/add`,
                  permission: "sellers:edit",
                },
              ],
            },
          ]}
          data-testid="store-regions-section-action-menu"
        />
      </div>
      {regions.length > 0 ? (
        regions.map((region) => (
          <RegionRow key={region.id} sellerId={seller.id} region={region} />
        ))
      ) : (
        <div className="flex flex-col items-center gap-y-1 px-6 py-6">
          <Text size="small" leading="compact" weight="plus">
            {t("stores.regions.empty.title")}
          </Text>
          <Text size="small" className="text-ui-fg-muted">
            {t("stores.regions.empty.message")}
          </Text>
        </div>
      )}
      <DisplayExtensionZone model="seller" zone="regions" data={seller} />
    </Container>
  );
};

const RegionRow = ({
  sellerId,
  region,
}: {
  sellerId: string;
  region: SellerRegionDTO;
}) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const { mutateAsync } = useBatchSellerRegions(sellerId);

  const handleRemove = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("stores.regions.removeWarning", { name: region.name }),
      cancelText: t("actions.cancel"),
      confirmText: t("actions.remove"),
    });

    if (!res) {
      return;
    }

    await mutateAsync(
      { remove: [region.id] },
      {
        onSuccess: () => {
          toast.success(t("stores.regions.toast.removed"));
        },
        onError: (e) => {
          toast.error(e.message);
        },
      },
    );
  };

  return (
    <div
      className="flex items-center justify-between gap-x-4 px-6 py-4"
      data-testid={`store-regions-section-row-${region.id}`}
    >
      <div className="flex items-center gap-x-3">
        <IconAvatar>
          <MapPin className="text-ui-fg-subtle" />
        </IconAvatar>
        <div className="flex flex-col">
          <Text size="small" leading="compact" weight="plus">
            {region.name}
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {region.currency_code.toUpperCase()}
          </Text>
        </div>
      </div>
      <div className="flex items-center gap-x-2">
        <Badge size="2xsmall">{region.currency_code.toUpperCase()}</Badge>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.remove"),
                  icon: <Trash />,
                  onClick: handleRemove,
                  permission: "sellers:edit",
                },
              ],
            },
          ]}
          data-testid={`store-regions-section-row-action-menu-${region.id}`}
        />
      </div>
    </div>
  );
};
