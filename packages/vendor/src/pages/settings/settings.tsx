import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSettingsLandingRoute } from "../../components/layout/settings-layout/settings-layout";

export const Component = () => {
  const location = useLocation();
  const landing = useSettingsLandingRoute();

  if (location.pathname === "/settings") {
    return <Navigate to={landing} replace />;
  }

  return <Outlet />;
};
