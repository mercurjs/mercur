import { ReactNode } from "react";

import { clx } from "@medusajs/ui";

import { assetUrl } from "../../../utils/asset-url";
import { AuthLanguageSelect } from "./auth-language-select";

type AuthLayoutProps = {
  children: ReactNode;
  align?: "start" | "center";
};

export const AuthLayout = ({ children, align = "start" }: AuthLayoutProps) => {
  const isCentered = align === "center";

  return (
    <div className="flex h-dvh w-dvw overflow-hidden">
      <div className="bg-ui-bg-base border-ui-border-base flex h-full w-full flex-col overflow-y-auto border-r lg:w-[584px] lg:shrink-0">
        <div className="flex justify-end px-8 pt-8 lg:px-14 lg:pt-12">
          <AuthLanguageSelect />
        </div>
        <div
          className={clx(
            "flex flex-1 flex-col px-8 pb-8 lg:px-14 lg:pb-12",
            isCentered && "justify-center",
          )}
        >
          {isCentered ? (
            <div className="flex w-full flex-col">
              {children}
            </div>
          ) : (
            children
          )}
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
