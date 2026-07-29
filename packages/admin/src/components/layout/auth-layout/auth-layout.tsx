import { ReactNode } from "react";

import { assetUrl } from "../../../utils/asset-url";

type AuthLayoutProps = {
  children: ReactNode;
};

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="flex h-dvh w-dvw overflow-hidden" data-testid="login-page">
      <div className="bg-ui-bg-base border-ui-border-base flex h-full w-full flex-col overflow-y-auto border-r lg:w-[584px] lg:shrink-0">
        <div className="flex flex-1 flex-col px-8 pb-8 pt-8 lg:px-14 lg:pb-12 lg:pt-12">
          {children}
        </div>
      </div>
      <div className="relative hidden flex-1 overflow-hidden lg:flex">
        <img
          src={assetUrl("/onboarding/illustration.svg")}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
};
