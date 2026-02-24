import { ArrowUturnLeft, MinusMini } from "@medusajs/icons";
import { clx, Divider, IconButton, Text } from "@medusajs/ui";
import { Collapsible as RadixCollapsible } from "radix-ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { INavItem, NavItem } from "../nav-item";
import { Shell } from "../shell";
import { Header as SellerDropdown } from "../main-layout/main-layout";
import components from "virtual:mercur/components";
import menuItemsModule from "virtual:mercur/menu-items";
import { getMenuItemsByType, getNestedMenuItems } from "../../../utils/routes";

export const SettingsLayout = () => {
  const Sidebar = components.SettingsSidebar
    ? components.SettingsSidebar
    : SettingsSidebar;

  return (
    <Shell>
      <Sidebar />
    </Shell>
  );
};

const allMenuItems = menuItemsModule.menuItems ?? [];
const customSettingsItems = getMenuItemsByType(allMenuItems, "settings");
const extensionNavItems: INavItem[] = customSettingsItems
  .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  .map((item) => ({
    label: item.label,
    to: item.path,
    translationNs: item.translationNs,
  }));

const useSettingRoutes = (): INavItem[] => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        label: t("seller.domain", "Seller"),
        to: "/settings/seller",
      },
      // {
      //   label: t("users.domain"),
      //   to: "/settings/users",
      // },
      {
        label: t("productTypes.domain"),
        to: "/settings/product-types",
      },
      {
        label: t("productTags.domain"),
        to: "/settings/product-tags",
      },
      {
        label: t("stockLocations.domain"),
        to: "/settings/locations",
      },
      ...extensionNavItems,
    ],
    [t],
  );
};

/**
 * Ensure that the `from` prop is not another settings route, to avoid
 * the user getting stuck in a navigation loop.
 */
const getSafeFromValue = (from: string) => {
  if (from.startsWith("/settings")) {
    return "/orders";
  }

  return from;
};

const SettingsSidebar = () => {
  const generalRoutes = useSettingRoutes();

  const { t } = useTranslation();

  return (
    <aside className="relative flex flex-1 flex-col justify-between overflow-y-auto">
      <div className="bg-ui-bg-subtle sticky top-0">
        <Header />
        <div className="flex items-center justify-center px-3">
          <Divider variant="dashed" />
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col overflow-y-auto">
          <RadixCollapsibleSection
            label={t("app.nav.settings.general")}
            items={generalRoutes}
          />
        </div>
        <div className="bg-ui-bg-subtle sticky bottom-0">
          <UserSection />
        </div>
      </div>
    </aside>
  );
};

const Header = () => {
  const [from, setFrom] = useState("/orders");

  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.from) {
      setFrom(getSafeFromValue(location.state.from));
    }
  }, [location]);

  return (
    <div className="bg-ui-bg-subtle p-3">
      <Link
        to={from}
        replace
        className={clx(
          "bg-ui-bg-subtle transition-fg flex items-center rounded-md outline-none",
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

const RadixCollapsibleSection = ({
  label,
  items,
}: {
  label: string;
  items: INavItem[];
}) => {
  return (
    <RadixCollapsible.Root defaultOpen className="py-3">
      <div className="px-3">
        <div className="text-ui-fg-muted flex h-7 items-center justify-between px-2">
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
            {items.map((setting) => (
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
      <SellerDropdown />
    </div>
  );
};
