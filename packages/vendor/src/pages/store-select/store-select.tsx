import { ChevronRight, Plus, Spinner } from "@medusajs/icons";
import { Avatar, Heading, StatusBadge, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import AvatarBox from "@components/common/logo-box/avatar-box";
import { useSelectSeller, useSellers } from "@hooks/api";
import { SellerMemberDTO, SellerStatus } from "@mercurjs/types";

const getSellerStatusBadge = (
  status: string,
  t: (key: string) => string,
): { color: "green" | "orange" | "red" | "grey"; label: string } => {
  switch (status) {
    case SellerStatus.OPEN:
      return { color: "green", label: t("storeSelect.status.open") };
    case SellerStatus.PENDING_APPROVAL:
      return {
        color: "orange",
        label: t("storeSelect.status.pendingApproval"),
      };
    case SellerStatus.SUSPENDED:
      return { color: "red", label: t("storeSelect.status.suspended") };
    case SellerStatus.TERMINATED:
      return { color: "grey", label: t("storeSelect.status.terminated") };
    default:
      return { color: "grey", label: status };
  }
};

const StoreSelectLogo = () => {
  return <AvatarBox />;
};

const StoreSelectHeader = () => {
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex flex-col items-center">
      <Heading>{t("storeSelect.title")}</Heading>
      <Text size="small" className="text-ui-fg-subtle text-center">
        {t("storeSelect.subtitle")}
      </Text>
    </div>
  );
};

const StoreSelectList = ({
  seller_members,
  email,
}: {
  seller_members: SellerMemberDTO[];
  email: string;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync: selectSeller } = useSelectSeller();

  const handleSelect = async (sellerId: string) => {
    await selectSeller({ seller_id: sellerId });
    navigate("/", { replace: true });
  };

  return (
    <div className="shadow-elevation-card-rest bg-ui-bg-base flex w-full flex-col divide-y rounded-lg">
      {seller_members?.map((member) => {
        const seller = member.seller;
        const badge = getSellerStatusBadge(seller.status, t);

        return (
          <button
            key={seller.id}
            onClick={() => handleSelect(seller.id)}
            className="transition-fg flex items-center gap-x-3 px-4 py-3 first:rounded-t-lg enabled:hover:bg-ui-bg-base-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Avatar
              variant="squared"
              size="small"
              fallback={seller.name.charAt(0).toUpperCase()}
            />
            <div className="flex flex-1 flex-col items-start">
              <Text size="small" weight="plus" leading="compact">
                {seller.name}
              </Text>
              <Text
                size="xsmall"
                className="text-ui-fg-subtle"
                leading="compact"
              >
                {seller.handle}
              </Text>
            </div>
            <StatusBadge color={badge.color}>{badge.label}</StatusBadge>
            <ChevronRight className="text-ui-fg-muted" />
          </button>
        );
      })}
      <button
        onClick={() => navigate("/onboarding", { state: { email } })}
        className="hover:bg-ui-bg-base-hover transition-fg flex items-center justify-center gap-x-2 rounded-b-lg px-4 py-3"
      >
        <Plus className="text-ui-fg-muted" />
        <Text size="small" weight="plus" leading="compact">
          {t("storeSelect.addNewStore")}
        </Text>
      </button>
    </div>
  );
};

const StoreSelectFooter = () => {
  return null;
};

const Root = () => {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email ?? "";
  const { seller_members, isLoading } = useSellers();

  if (isLoading) {
    return (
      <div className="bg-ui-bg-subtle flex min-h-dvh w-dvw items-center justify-center">
        <Spinner className="text-ui-fg-muted animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-ui-bg-subtle flex min-h-dvh w-dvw items-center justify-center">
      <div className="flex w-[380px] flex-col items-center">
        <StoreSelectLogo />
        <StoreSelectHeader />
        <StoreSelectList
          seller_members={seller_members ?? []}
          email={email}
        />
        <StoreSelectFooter />
      </div>
    </div>
  );
};

export const StoreSelectPage = Object.assign(Root, {
  Logo: StoreSelectLogo,
  Header: StoreSelectHeader,
  List: StoreSelectList,
  Footer: StoreSelectFooter,
});
