import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

import { ArrowUturnLeft, MinusMini } from "@medusajs/icons";
import { Divider, IconButton, Text, clx } from "@medusajs/ui";

import { Collapsible as RadixCollapsible } from "radix-ui";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { type INavItem, NavItem } from "@components/layout/nav-item";
import { Shell } from "@components/layout/shell";
import { UserMenu } from "@components/layout/user-menu";
import menuItemsModule from "virtual:mercur/menu-items";
import {
  type NavGroup,
  type NavGroupItem,
  applyNavGroups,
  useExtension,
  usePermissions,
} from "@mercurjs/dashboard-shared";
import { useExpandedSidebar } from "../../../providers/sidebar-provider";
import {
  filterMenuItemsByPermissions,
  getMenuItemsByType,
} from "../../../utils/routes";
import { canReachRoute } from "../../../lib/permissions/can-reach-route";
import { useLandingRoute } from "../main-layout/main-layout";

export const SettingsLayout = () => {
  useExpandedSidebar();

  return (
    <Shell rail={false}>
      <SettingsSidebar />
    </Shell>
  );
};

const allMenuItems = menuItemsModule.menuItems ?? [];

const navId = (to: string) => to.replace(/^\//, "");

const toGroupItem = ({ label, to }: INavItem): NavGroupItem => ({
  id: navId(to),
  label,
  to,
});

const useExtensionNavItems = () => {
  const { hasAnyPermission, hasAllPermissions } = usePermissions();
  const canReach = useCanReach();

  return useMemo(
    () =>
      getMenuItemsByType(
        filterMenuItemsByPermissions(allMenuItems, {
          hasAnyPermission,
          hasAllPermissions,
        }),
        "settings",
      )
        .map((item) => ({
          id: navId(item.path),
          label: item.label,
          to: item.path,
          translationNs: item.translationNs,
          group: item.group,
          rank: item.rank,
        }))
        .filter(canReach),
    [hasAnyPermission, hasAllPermissions, canReach],
  );
};

const useSettingRoutes = (): INavItem[] => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        label: t("marketplace.domain"),
        to: "/settings/marketplace",
      },
      {
        label: t("users.domain"),
        to: "/settings/users",
      },
      {
        label: t("regions.domain"),
        to: "/settings/regions",
      },
      {
        label: t("taxRegions.domain"),
        to: "/settings/tax-regions",
      },
      {
        label: t("returnReasons.domain"),
        to: "/settings/return-reasons",
      },
      {
        label: t("refundReasons.domain"),
        to: "/settings/refund-reasons",
      },
      {
        label: t("salesChannels.domain"),
        to: "/settings/sales-channels",
      },
      {
        label: t("productTypes.domain"),
        to: "/settings/product-types",
      },
      {
        label: t("productTags.domain"),
        to: "/settings/product-tags",
      },
      {
        label: t("attributes.domain"),
        to: "/settings/attributes",
      },
      {
        label: t("stockLocations.domain"),
        to: "/settings/locations",
      },
      {
        label: t("commissions.domain"),
        to: "/settings/commissions",
      },
    ],
    [t],
  );
};

const useDeveloperRoutes = (): INavItem[] => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        label: t("apiKeyManagement.domain.publishable"),
        to: "/settings/publishable-api-keys",
      },
      {
        label: t("apiKeyManagement.domain.secret"),
        to: "/settings/secret-api-keys",
      },
    ],
    [t],
  );
};

const useMyAccountRoutes = (): INavItem[] => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        label: t("profile.domain"),
        to: "/settings/profile",
      },
    ],
    [t],
  );
};

/**
 * Ensure that the `from` prop is not another settings route, to avoid
 * the user getting stuck in a navigation loop.
 */
const getSafeFromValue = (from: string, landing: string) => {
  if (from.startsWith("/settings")) {
    return landing;
  }

  return from;
};

// `RoutePermissionGuard` is what actually refuses a route; this keeps the
// sidebar and the redirects from pointing at one the actor can't open.
const useCanReach = () => {
  const permissions = usePermissions();

  return useCallback(
    ({ to }: { to: string }) => canReachRoute(permissions, to),
    [permissions],
  );
};

const useSettingsGroups = (): NavGroup[] => {
  const { t } = useTranslation();
  const canReach = useCanReach();
  const extension = useExtension();

  const routes = useSettingRoutes();
  const developerRoutes = useDeveloperRoutes();
  const myAccountRoutes = useMyAccountRoutes();
  const extensionNavItems = useExtensionNavItems();

  return useMemo(
    () =>
      applyNavGroups(
        [
          {
            id: "general",
            label: t("app.nav.settings.general"),
            items: routes.filter(canReach).map(toGroupItem),
          },
          {
            id: "developer",
            label: t("app.nav.settings.developer"),
            items: developerRoutes.filter(canReach).map(toGroupItem),
          },
          {
            id: "myAccount",
            label: t("app.nav.settings.myAccount"),
            items: myAccountRoutes.map(toGroupItem),
          },
        ],
        extensionNavItems,
        {
          groups: extension.getNavGroups(),
          items: extension.getNavOverrides(),
        },
      ),
    [
      t,
      canReach,
      extension,
      routes,
      developerRoutes,
      myAccountRoutes,
      extensionNavItems,
    ],
  );
};

const PROFILE_ROUTE = "/settings/profile";

// Where `/settings` lands: the first settings page the actor can open, or
// their own profile, which needs no permission.
export const useSettingsLandingRoute = () => {
  const routes = useSettingsGroups().flatMap((group) => group.items);

  return routes.find(({ to }) => to !== PROFILE_ROUTE)?.to ?? PROFILE_ROUTE;
};

const SettingsSidebar = () => {
  const groups = useSettingsGroups();

  return (
    <aside className="relative flex flex-1 flex-col justify-between overflow-y-auto">
      <div className="sticky top-0 bg-ui-bg-subtle">
        <Header />
        <div className="flex items-center justify-center px-3">
          <Divider variant="dashed" />
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col overflow-y-auto">
          {groups.map((group, index) => (
            <Fragment key={group.id}>
              {index > 0 && (
                <div className="flex items-center justify-center px-3">
                  <Divider variant="dashed" />
                </div>
              )}
              <RadixCollapsibleSection group={group} />
            </Fragment>
          ))}
        </div>
        <div className="sticky bottom-0 bg-ui-bg-subtle">
          <UserSection />
        </div>
      </div>
    </aside>
  );
};

const Header = () => {
  const landing = useLandingRoute();
  const [from, setFrom] = useState<string>();

  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.from) {
      setFrom(getSafeFromValue(location.state.from, landing));
    }
  }, [location, landing]);

  return (
    <div className="bg-ui-bg-subtle p-3">
      <Link
        to={from ?? landing}
        replace
        className={clx(
          "flex items-center rounded-md bg-ui-bg-subtle outline-none transition-fg",
          "hover:bg-ui-bg-subtle-hover",
          "focus-visible:shadow-borders-focus",
        )}
      >
        <div className="flex items-center gap-x-2.5 px-2 py-1">
          <div className="flex items-center justify-center">
            <ArrowUturnLeft className="text-ui-fg-subtle" />
          </div>
          <Text leading="compact" weight="plus" size="small">
            {t("app.nav.settings.header")}
          </Text>
        </div>
      </Link>
    </div>
  );
};

const RadixCollapsibleSection = ({ group }: { group: NavGroup }) => {
  const { t } = useTranslation(group.translationNs);
  const label = group.translationNs ? t(group.label) : group.label;

  return (
    <RadixCollapsible.Root defaultOpen className="py-3">
      <div className="px-3">
        <div className="flex h-7 items-center justify-between px-2 text-ui-fg-muted">
          <Text size="small" leading="compact">
            {label}
          </Text>
          <RadixCollapsible.Trigger asChild>
            <IconButton size="2xsmall" variant="transparent" className="static">
              <MinusMini className="text-ui-fg-muted" />
            </IconButton>
          </RadixCollapsible.Trigger>
        </div>
      </div>
      <RadixCollapsible.Content>
        <div className="pt-0.5">
          <nav className="flex flex-col gap-y-0.5">
            {group.items.map(({ id: _id, ...setting }) => (
              <NavItem key={setting.to} type="setting" {...setting} />
            ))}
          </nav>
        </div>
      </RadixCollapsible.Content>
    </RadixCollapsible.Root>
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
