import {
  Buildings,
  CogSixTooth,
  CurrencyDollar,
  CreditCardRefresh,
  EllipsisHorizontal,
  MagnifyingGlass,
  Plus,
  ReceiptPercent,
  ShoppingCart,
  Tag,
  Users,
} from "@medusajs/icons";
import { Avatar, Divider, DropdownMenu, Text, clx } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { Skeleton } from "../../common/skeleton";
import { INavItem, NavItem } from "../../layout/nav-item";
import { Shell } from "../../layout/shell";

import { useLocation, useNavigate } from "react-router-dom";
import { useMe, useSelectSeller, useSellers } from "../../../hooks/api";
import { useSearch } from "../../../providers/search-provider";
import { UserMenu } from "../user-menu";
import { useDocumentDirection } from "../../../hooks/use-document-direction";
import components from "virtual:mercur/components";
import menuItemsModule from "virtual:mercur/menu-items";
import { getMenuItemsByType, getNestedMenuItems } from "../../../utils/routes";

export const MainLayout = () => {
  const Sidebar = components.MainSidebar ? components.MainSidebar : MainSidebar;
  return (
    <Shell>
      <Sidebar />
    </Shell>
  );
};

const allMenuItems = menuItemsModule.menuItems ?? [];

const addNestedItems = (
  to: string,
  items?: { label: string; to: string; translationNs?: string }[],
) => {
  const nestedItems = getNestedMenuItems(allMenuItems, to);
  if (nestedItems.length === 0) {
    return items;
  }

  const nestedNavItems = nestedItems.map((item) => ({
    label: item.label,
    to: item.path,
    translationNs: item.translationNs,
  }));

  return [...(items ?? []), ...nestedNavItems];
};

const MainSidebar = () => {
  const coreRoutes = useCoreRoutes();
  const customMenuItems = getMenuItemsByType(allMenuItems, "main");

  const routesWithNested = coreRoutes.map((route) => ({
    ...route,
    items: addNestedItems(route.to, route.items),
  }));

  const customRoutesWithNested = customMenuItems
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((item) => {
      const Icon = item.icon;
      return {
        label: item.label,
        to: item.path,
        icon: Icon ? <Icon /> : undefined,
        translationNs: item.translationNs,
        items: addNestedItems(item.path),
      };
    });

  return (
    <aside className="flex flex-1 flex-col justify-between overflow-y-auto">
      <div className="flex flex-1 flex-col">
        <div className="bg-ui-bg-subtle sticky top-0">
          <Header />
          <div className="px-3">
            <Divider variant="dashed" />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <div className="flex flex-1 flex-col">
            <nav className="flex flex-col gap-y-1 py-3">
              <Searchbar />
              {routesWithNested.map((route) => {
                return <NavItem key={route.to} {...route} />;
              })}
              {customRoutesWithNested.map((route) => (
                <NavItem key={route.to} {...route} />
              ))}
            </nav>
          </div>
          <UtilitySection />
        </div>

        {/* <div className="bg-ui-bg-subtle sticky bottom-0">
          <UserSection />
        </div> */}
      </div>
    </aside>
  );
};

const StoreList = ({ currentSellerId }: { currentSellerId: string }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { seller_member } = useMe();
  const { seller_members } = useSellers();
  const { mutateAsync: selectSeller } = useSelectSeller();

  const handleSelect = async (sellerId: string) => {
    if (sellerId === currentSellerId) return;
    await selectSeller({ seller_id: sellerId });
    navigate("/", { replace: true });
  };

  return (
    <>
      {!!seller_members?.length && (
        <DropdownMenu.RadioGroup value={currentSellerId}>
          {seller_members.map((member) => {
            const seller = member.seller;
            return (
              <DropdownMenu.RadioItem
                key={seller.id}
                value={seller.id}
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(seller.id);
                }}
                className="gap-x-2"
              >
                <Avatar
                  variant="squared"
                  size="xsmall"
                  fallback={seller.name.charAt(0).toUpperCase()}
                />
                <Text
                  size="small"
                  weight="plus"
                  leading="compact"
                  className="truncate"
                >
                  {seller.name}
                </Text>
              </DropdownMenu.RadioItem>
            );
          })}
        </DropdownMenu.RadioGroup>
      )}
      {!!seller_members?.length && <DropdownMenu.Separator />}
      <DropdownMenu.Item
        onClick={() =>
          navigate("/onboarding", {
            state: { email: seller_member?.member.email },
          })
        }
        className="gap-x-2"
      >
        <Plus className="text-ui-fg-subtle" />
        <Text size="small" weight="plus" leading="compact">
          {t("storeSelect.addNewStore")}
        </Text>
      </DropdownMenu.Item>
    </>
  );
};

export const Header = () => {
  const { t } = useTranslation();
  const { seller_member, isPending, isError, error } = useMe();
  const direction = useDocumentDirection();
  const name = seller_member?.seller.name;
  const fallback = seller_member?.seller?.name?.slice(0, 1).toUpperCase();

  const isLoaded = !isPending && !!seller_member && !!name && !!fallback;

  if (isError) {
    throw error;
  }

  return (
    <div className="w-full p-3">
      <DropdownMenu dir={direction}>
        <DropdownMenu.Trigger
          disabled={!isLoaded}
          className={clx(
            "bg-ui-bg-subtle transition-fg grid w-full grid-cols-[24px_1fr_15px] items-center gap-x-3 rounded-md p-0.5 pe-2 outline-none",
            "hover:bg-ui-bg-subtle-hover",
            "data-[state=open]:bg-ui-bg-subtle-hover",
            "focus-visible:shadow-borders-focus",
          )}
        >
          {fallback ? (
            <Avatar variant="squared" size="xsmall" fallback={fallback} />
          ) : (
            <Skeleton className="h-6 w-6 rounded-md" />
          )}
          <div className="block overflow-hidden text-start">
            {name ? (
              <Text
                size="small"
                weight="plus"
                leading="compact"
                className="truncate"
              >
                {seller_member.seller.name}
              </Text>
            ) : (
              <Skeleton className="h-[9px] w-[120px]" />
            )}
          </div>
          <EllipsisHorizontal className="text-ui-fg-muted" />
        </DropdownMenu.Trigger>
        {isLoaded && (
          <DropdownMenu.Content className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-0">
            <div className="flex items-center gap-x-3 px-2 py-1">
              <Avatar variant="squared" size="small" fallback={fallback} />
              <div className="flex flex-col overflow-hidden">
                <Text
                  size="small"
                  weight="plus"
                  leading="compact"
                  className="truncate"
                >
                  {name}
                </Text>
                <Text
                  size="xsmall"
                  leading="compact"
                  className="text-ui-fg-subtle"
                >
                  {t("app.menus.store.label")}
                </Text>
              </div>
            </div>
            <DropdownMenu.Separator />
            <StoreList currentSellerId={seller_member.seller.id} />
          </DropdownMenu.Content>
        )}
      </DropdownMenu>
    </div>
  );
};

export const useCoreRoutes = (): Omit<INavItem, "pathname">[] => {
  const { t } = useTranslation();

  return [
    {
      icon: <ShoppingCart />,
      label: t("orders.domain"),
      to: "/orders",
      items: [
        // TODO: Enable when domin is introduced
        // {
        //   label: t("draftOrders.domain"),
        //   to: "/draft-orders",
        // },
      ],
    },
    {
      icon: <Tag />,
      label: t("products.domain"),
      to: "/products",
      items: [
        {
          label: t("collections.domain"),
          to: "/collections",
        },
        {
          label: t("categories.domain"),
          to: "/categories",
        },
        // TODO: Enable when domin is introduced
        // {
        //   label: t("giftCards.domain"),
        //   to: "/gift-cards",
        // },
      ],
    },
    {
      icon: <Buildings />,
      label: t("inventory.domain"),
      to: "/inventory",
      items: [],
    },
    {
      icon: <Users />,
      label: t("customers.domain"),
      to: "/customers",
      items: [],
    },
    {
      icon: <ReceiptPercent />,
      label: t("promotions.domain"),
      to: "/promotions",
      items: [
        {
          label: t("campaigns.domain"),
          to: "/campaigns",
        },
      ],
    },
    {
      icon: <CurrencyDollar />,
      label: t("priceLists.domain"),
      to: "/price-lists",
    },
    {
      icon: <CreditCardRefresh />,
      label: t("payouts.domain"),
      to: "/payouts",
    },
  ];
};

const Searchbar = () => {
  const { t } = useTranslation();
  const { toggleSearch } = useSearch();

  return (
    <div className="px-3">
      <button
        onClick={toggleSearch}
        className={clx(
          "bg-ui-bg-subtle text-ui-fg-subtle flex w-full items-center gap-x-2.5 rounded-md px-2 py-1 outline-none",
          "hover:bg-ui-bg-subtle-hover",
          "focus-visible:shadow-borders-focus",
        )}
      >
        <MagnifyingGlass />
        <div className="flex-1 text-start">
          <Text size="small" leading="compact" weight="plus">
            {t("app.search.label")}
          </Text>
        </div>
        <Text size="small" leading="compact" className="text-ui-fg-muted">
          ⌘K
        </Text>
      </button>
    </div>
  );
};

const UtilitySection = () => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-y-0.5 py-3">
        <NavItem
          label={t("app.nav.settings.header")}
          to="/settings"
          from={location.pathname}
          icon={<CogSixTooth />}
        />
      </div>
      <div className="px-3">
        <Divider variant="dashed" />
      </div>
      <UserMenu />
    </div>
  );
};
