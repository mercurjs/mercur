import React from "react";
import { Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SettingsCard from "../../components/atoms/settings-card";
import Spacer from "../../components/atoms/spacer";
import SettingContainer from "../../components/extensions/setting-container";
import SettingsPageErrorElement from "../../components/extensions/setting-container/setting-error-element";
import FeatureToggle from "../../components/fundamentals/feature-toggle";
import CoinsIcon from "../../components/fundamentals/icons/coins-icon";
import GearIcon from "../../components/fundamentals/icons/gear-icon";
import HappyIcon from "../../components/fundamentals/icons/happy-icon";
import UsersIcon from "../../components/fundamentals/icons/users-icon";
import { useSettings } from "../../providers/setting-provider";
import CurrencySettings from "./currencies";
import Details from "./details";
import PersonalInformation from "./personal-information";
import Users from "./users";
import UserEdit from "./users/details";
import MapPinIcon from "../../components/fundamentals/icons/map-pin-icon";
import Regions from "./regions";
import ShippingOptions from "./shipping-options";
import TruckIcon from "../../components/fundamentals/icons/truck-icon";

type SettingsCardType = {
  heading: string;
  description: string;
  icon?: React.ComponentType;
  to: string;
  feature_flag?: string;
};

const settings: SettingsCardType[] = [
  {
    heading: "Personal Information",
    description: "Manage your profile",
    icon: HappyIcon,
    to: "/a/settings/personal-information",
  },
  {
    heading: "The Team",
    description: "Manage users of your Store",
    icon: UsersIcon,
    to: "/a/settings/team",
  },
  {
    heading: "Currencies",
    description: "Manage the currencies of your store",
    icon: CoinsIcon,
    to: "/a/settings/currencies",
  },
  {
    heading: "Shipping Options",
    description: "Manage shipping options in your Store",
    icon: TruckIcon,
    to: "/a/settings/shipping-options",
  },
];

const renderCard = ({
  heading,
  description,
  icon,
  to,
  feature_flag,
}: SettingsCardType) => {
  const Icon = icon || GearIcon;

  const card = (
    <SettingsCard
      heading={heading}
      description={description}
      icon={<Icon />}
      to={to}
    />
  );

  if (feature_flag) {
    return <FeatureToggle featureFlag={feature_flag}>{card}</FeatureToggle>;
  }

  return card;
};

const SettingsIndex = () => {
  const { getCards } = useSettings();

  const extensionCards = getCards();

  const { t } = useTranslation();

  return (
    <div className="gap-y-xlarge flex flex-col">
      <div className="gap-y-large flex flex-col">
        <div className="gap-y-2xsmall flex flex-col">
          <h2 className="inter-xlarge-semibold">General</h2>
          <p className="inter-base-regular text-grey-50">
            {t(
              "settings-manage-the-general-settings-for-your-store",
              "Manage the general settings for your store"
            )}
          </p>
        </div>
        <div className="medium:grid-cols-2 gap-y-xsmall grid grid-cols-1 gap-x-4">
          {settings.map((s) => renderCard(s))}
        </div>
      </div>
      {extensionCards.length > 0 && (
        <div className="gap-y-large flex flex-col">
          <div className="gap-y-2xsmall flex flex-col">
            <h2 className="inter-xlarge-semibold">Extensions</h2>
            <p className="inter-base-regular text-grey-50">
              {t(
                "settings-manage-the-settings-for-your-store-apos-s-extensions",
                "Manage the settings for your store&apos;s extensions"
              )}
            </p>
          </div>
          <div className="medium:grid-cols-2 gap-y-xsmall grid grid-cols-1 gap-x-4">
            {getCards().map((s) =>
              renderCard({
                heading: s.label,
                description: s.description,
                icon: s.icon,
                to: `/a/settings${s.path}`,
              })
            )}
          </div>
        </div>
      )}
      <Spacer />
    </div>
  );
};

const Settings = () => {
  const { getSettings } = useSettings();

  return (
    <Routes>
      <Route index element={<SettingsIndex />} />
      <Route path="/details" element={<Details />} />
      <Route path="/currencies" element={<CurrencySettings />} />
      <Route path="/team" element={<Users />} />
      <Route path="/team/:id" element={<UserEdit />} />
      <Route path="/personal-information" element={<PersonalInformation />} />
      <Route path="/shipping-options/*" element={<ShippingOptions />} />
      {getSettings().map((s) => (
        <Route
          key={s.path}
          path={s.path}
          element={<SettingContainer Page={s.Page} />}
          errorElement={<SettingsPageErrorElement origin={s.origin} />}
        />
      ))}
    </Routes>
  );
};

export default Settings;
