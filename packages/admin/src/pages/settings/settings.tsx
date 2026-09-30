import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { useSettingsLandingRoute } from "../../components/layout/settings-layout/settings-layout";

export const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const landing = useSettingsLandingRoute();

  useEffect(() => {
    if (location.pathname === "/settings") {
      navigate(landing, { replace: true });
    }
  }, [location.pathname, navigate, landing]);

  return <Outlet />;
};
