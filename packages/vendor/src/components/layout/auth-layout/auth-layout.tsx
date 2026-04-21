import { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="flex h-dvh w-dvw overflow-hidden">
      <div className="bg-ui-bg-base border-ui-border-base flex h-full w-full flex-col overflow-y-auto border-r lg:w-[584px] lg:shrink-0">
        <div className="flex flex-1 flex-col p-8 lg:px-14 lg:py-12">
          {children}
        </div>
      </div>
      <div
        className="relative hidden flex-1 items-center justify-center overflow-hidden lg:flex"
        style={{
          backgroundImage: "url(/onboarding/bg.svg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <img
          src="/onboarding/0.png"
          alt=""
          className="max-h-[75%] w-[75%] object-contain"
        />
      </div>
    </div>
  );
};
