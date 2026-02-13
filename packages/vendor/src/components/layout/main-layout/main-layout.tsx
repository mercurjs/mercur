import {
  BookOpen,
  BuildingStorefront,
  Buildings,
  CogSixTooth,
  CurrencyDollar,
  EllipsisHorizontal,
  MagnifyingGlass,
  OpenRectArrowOut,
  ReceiptPercent,
  ShoppingCart,
  Tag,
  TimelineVertical,
  Users,
} from "@medusajs/icons";
import { Avatar, Divider, DropdownMenu, Text, clx } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { Skeleton } from "../../common/skeleton";
import { INavItem, NavItem } from "../../layout/nav-item";
import { Shell } from "../../layout/shell";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLogout, useMe } from "../../../hooks/api";
import { queryClient } from "../../../lib/query-client";
import { useSearch } from "../../../providers/search-provider";
import { ThemeToggle, UserMenu } from "../user-menu";
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

const Logout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { mutateAsync: logoutMutation } = useLogout();

  const handleLogout = async () => {
    await logoutMutation(undefined, {
      onSuccess: () => {
        /**
         * When the user logs out, we want to clear the query cache
         */
        queryClient.clear();
        navigate("/login");
      },
    });
  };

  return (
    <DropdownMenu.Item onClick={handleLogout}>
      <div className="flex items-center gap-x-2">
        <OpenRectArrowOut className="text-ui-fg-subtle" />
        <span>{t("app.menus.actions.logout")}</span>
      </div>
    </DropdownMenu.Item>
  );
};

const Header = () => {
  const { t } = useTranslation();
  const { seller, isPending, isError, error } = useMe();
  const direction = useDocumentDirection();
  const name = seller?.name;
  const fallback = seller?.name?.slice(0, 1).toUpperCase();

  const isLoaded = !isPending && !!seller && !!name && !!fallback;

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
                {seller.name}
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
                  {t("app.menus.seller.label")}
                </Text>
              </div>
            </div>
            <DropdownMenu.Separator />
            <DropdownMenu.Item className="gap-x-2" asChild>
              <Link to="/settings/store">
                <BuildingStorefront className="text-ui-fg-subtle" />
                {t("app.menus.seller.sellerSettings")}
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item asChild>
              <Link to="https://docs.mercurjs.com" target="_blank">
                <BookOpen className="text-ui-fg-subtle me-2" />
                {t("app.menus.user.documentation")}
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link to="https://www.mercurjs.com/updates" target="_blank">
                <TimelineVertical className="text-ui-fg-subtle me-2" />
                {t("app.menus.user.changelog")}
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <ThemeToggle />
            <DropdownMenu.Separator />
            <Logout />
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
    <div className="flex flex-col gap-y-0.5 py-3">
      <NavItem
        label={t("app.nav.settings.header")}
        to="/settings"
        from={location.pathname}
        icon={<CogSixTooth />}
      />
    </div>
  );
};

const UserSection = () => {
  return (
    <div>
      <div className="px-3">
        <Divider variant="dashed" />
      </div>
      <UserMenu />
    </div>
  );
};
