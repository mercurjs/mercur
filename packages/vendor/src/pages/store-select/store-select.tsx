import { ChevronRight, Plus } from "@medusajs/icons";
import { Avatar, Heading, StatusBadge, Text } from "@medusajs/ui";
import { useNavigate } from "react-router-dom";

import AvatarBox from "@components/common/logo-box/avatar-box";

type StoreStatus = "active" | "pending_approval";

type MockStore = {
  id: string;
  name: string;
  handle: string;
  status: StoreStatus;
};

const MOCK_STORES: MockStore[] = [
  {
    id: "seller_01",
    name: "ASMobbin",
    handle: "app.mercur.com/as-mobbin",
    status: "active",
  },
  {
    id: "seller_02",
    name: "SLMobbin",
    handle: "app.mercur.com/sl-mobbin",
    status: "pending_approval",
  },
];

const StoreSelectLogo = () => {
  return <AvatarBox />;
};

const StoreSelectHeader = () => {
  return (
    <div className="mb-4 flex flex-col items-center">
      <Heading>Choose a store</Heading>
      <Text size="small" className="text-ui-fg-subtle text-center">
        These are all your available stores
      </Text>
    </div>
  );
};

const StoreSelectList = () => {
  const navigate = useNavigate();

  const handleSelect = (_storeId: string) => {
    navigate("/", { replace: true });
  };

  return (
    <div className="shadow-elevation-card-rest bg-ui-bg-base flex w-full flex-col divide-y rounded-lg">
      {MOCK_STORES.map((store) => {
        const isPending = store.status === "pending_approval";

        return (
          <button
            key={store.id}
            onClick={() => !isPending && handleSelect(store.id)}
            disabled={isPending}
            className="transition-fg flex items-center gap-x-3 px-4 py-3 first:rounded-t-lg enabled:hover:bg-ui-bg-base-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Avatar
              variant="squared"
              size="small"
              fallback={store.name.charAt(0).toUpperCase()}
            />
            <div className="flex flex-1 flex-col items-start">
              <Text size="small" weight="plus" leading="compact">
                {store.name}
              </Text>
              <Text size="xsmall" className="text-ui-fg-subtle" leading="compact">
                {store.handle}
              </Text>
            </div>
            {isPending ? (
              <StatusBadge variant="warning">Pending</StatusBadge>
            ) : (
              <ChevronRight className="text-ui-fg-muted" />
            )}
          </button>
        );
      })}
      <button
        onClick={() => navigate("/onboarding")}
        className="hover:bg-ui-bg-base-hover transition-fg flex items-center justify-center gap-x-2 rounded-b-lg px-4 py-3"
      >
        <Plus className="text-ui-fg-muted" />
        <Text size="small" weight="plus" leading="compact">
          Add new store
        </Text>
      </button>
    </div>
  );
};

const StoreSelectFooter = () => {
  return null;
};

const Root = () => {
  return (
    <div className="bg-ui-bg-subtle flex min-h-dvh w-dvw items-center justify-center">
      <div className="flex w-[380px] flex-col items-center">
        <StoreSelectLogo />
        <StoreSelectHeader />
        <StoreSelectList />
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
