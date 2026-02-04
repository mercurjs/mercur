import {
  BuildingStorefront,
  ChevronDownMini,
  CogSixTooth,
  EllipsisHorizontal,
  MagnifyingGlass,
  MinusMini,
  OpenRectArrowOut,
  SquaresPlus,
} from "@medusajs/icons";
import { Avatar, Divider, DropdownMenu, Text, clx } from "@medusajs/ui";

import { Collapsible as RadixCollapsible } from "radix-ui";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useLogout } from "../../../hooks/api";
import { useStore } from "../../../hooks/api/store";
import { useDocumentDirection } from "../../../hooks/use-document-direction";
import { getIcon } from "../../../lib/icon-registry";
import { queryClient } from "../../../lib/query-client";
import { useExtension } from "../../../providers/extension-provider";
import { useSearch } from "../../../providers/search-provider";
import { Skeleton } from "../../common/skeleton";
import { INavItem, NavItem } from "../../layout/nav-item";
import { Shell } from "../../layout/shell";
import { UserMenu } from "../user-menu";
import { items as navItems } from "virtual:mercur-navigation";

export const MainLayout = () => {
  return (
    <Shell>
      <MainSidebar />
    </Shell>
  );
};

const MainSidebar = () => {
  return (
    <aside
      className="flex flex-1 flex-col justify-between overflow-y-auto"
      data-testid="sidebar"
    >
      <div className="flex flex-1 flex-col">
        <div
          className="sticky top-0 bg-ui-bg-subtle"
          data-testid="sidebar-header-section"
        >
          <Header />
          <div className="px-3">
            <Divider variant="dashed" />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <div className="flex flex-1 flex-col">
            <CoreRouteSection />
            <ExtensionRouteSection />
          </div>
          <UtilitySection />
        </div>
        <div
          className="sticky bottom-0 bg-ui-bg-subtle"
          data-testid="sidebar-user-section"
        >
          <UserSection />
        </div>
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
    <DropdownMenu.Item onClick={handleLogout} data-testid="sidebar-header-dropdown-logout">
      <div className="flex items-center gap-x-2">
        <OpenRectArrowOut className="text-ui-fg-subtle" />
        <span>{t("app.menus.actions.logout")}</span>
      </div>
    </DropdownMenu.Item>
  );
};

const Header = () => {
  const { t } = useTranslation();
  const { store, isPending, isError, error } = useStore();
  const direction = useDocumentDirection();
  const name = store?.name;
  const fallback = store?.name?.slice(0, 1).toUpperCase();

  const isLoaded = !isPending && !!store && !!name && !!fallback;

  if (isError) {
    throw error;
  }

  return (
    <div className="w-full p-3" data-testid="sidebar-header-dropdown">
      <DropdownMenu dir={direction} data-testid="sidebar-header-dropdown-menu">
        <DropdownMenu.Trigger
          disabled={!isLoaded}
          className={clx(
            "grid w-full grid-cols-[24px_1fr_15px] items-center gap-x-3 rounded-md bg-ui-bg-subtle p-0.5 pe-2 outline-none transition-fg",
            "hover:bg-ui-bg-subtle-hover",
            "data-[state=open]:bg-ui-bg-subtle-hover",
            "focus-visible:shadow-borders-focus",
          )}
          data-testid="sidebar-header-dropdown-trigger"
        >
          {fallback ? (
            <Avatar variant="squared" size="xsmall" fallback={fallback} data-testid="sidebar-header-dropdown-avatar" />
          ) : (
            <Skeleton className="h-6 w-6 rounded-md" />
          )}
          <div className="block overflow-hidden text-start" data-testid="sidebar-header-dropdown-store-name">
            {name ? (
              <Text
                size="small"
                weight="plus"
                leading="compact"
                className="truncate"
              >
                {store.name}
              </Text>
            ) : (
              <Skeleton className="h-[9px] w-[120px]" />
            )}
          </div>
          <EllipsisHorizontal className="text-ui-fg-muted" />
        </DropdownMenu.Trigger>
        {isLoaded && (
          <DropdownMenu.Content className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-0" data-testid="sidebar-header-dropdown-content">
            <div className="flex items-center gap-x-3 px-2 py-1" data-testid="sidebar-header-dropdown-user-info">
              <Avatar variant="squared" size="small" fallback={fallback} data-testid="sidebar-header-dropdown-user-avatar" />
              <div className="flex flex-col overflow-hidden" data-testid="sidebar-header-dropdown-user-details">
                <Text
                  size="small"
                  weight="plus"
                  leading="compact"
                  className="truncate"
                  data-testid="sidebar-header-dropdown-user-name"
                >
                  {name}
                </Text>
                <Text
                  size="xsmall"
                  leading="compact"
                  className="text-ui-fg-subtle"
                  data-testid="sidebar-header-dropdown-store-label"
                >
                  {t("app.nav.main.store")}
                </Text>
              </div>
            </div>
            <DropdownMenu.Separator data-testid="sidebar-header-dropdown-separator-1" />
            <DropdownMenu.Item className="gap-x-2" asChild data-testid="sidebar-header-dropdown-store-settings">
              <Link to="/settings/store">
                <BuildingStorefront className="text-ui-fg-subtle" />
                {t("app.nav.main.storeSettings")}
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Separator data-testid="sidebar-header-dropdown-separator-2" />
            <Logout />
          </DropdownMenu.Content>
        )}
      </DropdownMenu>
    </div>
  );
};

const useNavigationRoutes = (): Omit<INavItem, "pathname">[] => {
  const { t } = useTranslation();

  const mainItems = navItems.filter(
    (item) => item.section !== "settings" && !item.hidden
  );

  const itemsWithParents = new Map<string, INavItem>();

  mainItems.forEach((item) => {
    if (item.parent) {
      return;
    }

    const Icon = getIcon(item.iconKey);
    const label = item.labelKey ? (t(item.labelKey as any) as string) : (item.label || item.id);

    const children = mainItems
      .filter((child) => child.parent === item.id)
      .map((child) => ({
        label: child.labelKey ? (t(child.labelKey as any) as string) : (child.label || child.id),
        to: child.path || `/${child.id}`,
      }))
      .sort((a, b) => a.to.localeCompare(b.to));

    itemsWithParents.set(item.id, {
      icon: Icon ? <Icon /> : undefined,
      label,
      to: item.path || `/${item.id}`,
      items: children.length > 0 ? children : undefined,
    });
  });

  const sortedItems = Array.from(itemsWithParents.values()).sort((a, b) => {
    const itemA = mainItems.find((i) => i.path === a.to || `/${i.id}` === a.to);
    const itemB = mainItems.find((i) => i.path === b.to || `/${i.id}` === b.to);
    return (itemA?.order || 999) - (itemB?.order || 999);
  });

  return sortedItems;
};

const Searchbar = () => {
  const { t } = useTranslation();
  const { toggleSearch } = useSearch();

  return (
    <div className="px-3" data-testid="sidebar-search">
      <button
        onClick={toggleSearch}
        className={clx(
          "flex w-full items-center gap-x-2.5 rounded-md bg-ui-bg-subtle px-2 py-1 text-ui-fg-subtle outline-none",
          "hover:bg-ui-bg-subtle-hover",
          "focus-visible:shadow-borders-focus",
        )}
        data-testid="sidebar-search-button"
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

const CoreRouteSection = () => {
  const coreRoutes = useNavigationRoutes();

  const { getMenu } = useExtension();

  const menuItems = getMenu("coreExtensions");

  menuItems.forEach((item) => {
    if (item.nested) {
      const route = coreRoutes.find((route) => route.to === item.nested);
      if (route) {
        route.items?.push(item);
      }
    }
  });

  return (
    <nav
      className="flex flex-col gap-y-1 py-3"
      data-testid="sidebar-core-routes"
    >
      <Searchbar />
      {coreRoutes.map((route) => {
        return <NavItem key={route.to} {...route} />;
      })}
    </nav>
  );
};

const ExtensionRouteSection = () => {
  const { t } = useTranslation();
  const { getMenu } = useExtension();

  const menuItems = getMenu("coreExtensions").filter((item) => !item.nested);

  if (!menuItems.length) {
    return null;
  }

  return (
    <div>
      <div className="px-3">
        <Divider variant="dashed" />
      </div>
      <div className="flex flex-col gap-y-1 py-3">
        <RadixCollapsible.Root defaultOpen>
          <div className="px-4">
            <RadixCollapsible.Trigger asChild className="group/trigger">
              <button className="flex w-full items-center justify-between px-2 text-ui-fg-subtle">
                <Text size="xsmall" weight="plus" leading="compact">
                  {t("app.nav.common.extensions")}
                </Text>
                <div className="text-ui-fg-muted">
                  <ChevronDownMini className="group-data-[state=open]/trigger:hidden" />
                  <MinusMini className="group-data-[state=closed]/trigger:hidden" />
                </div>
              </button>
            </RadixCollapsible.Trigger>
          </div>
          <RadixCollapsible.Content>
            <nav className="flex flex-col gap-y-0.5 py-1 pb-4">
              {menuItems.map((item, i) => {
                return (
                  <NavItem
                    key={i}
                    to={item.to}
                    label={item.label}
                    icon={item.icon ? item.icon : <SquaresPlus />}
                    items={item.items}
                    type="extension"
                  />
                );
              })}
            </nav>
          </RadixCollapsible.Content>
        </RadixCollapsible.Root>
      </div>
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
