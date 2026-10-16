import { ReactNode } from "react";

import { clx } from "@medusajs/ui";

const STAGGER_MS = 50;

export const AuthReveal = ({
  children,
  className,
  order,
}: {
  children: ReactNode;
  className?: string;
  order: number;
}) => {
  return (
    <div
      className={clx(
        "group-data-[reveal=true]/auth:animate-login-reveal motion-reduce:group-data-[reveal=true]/auth:animate-login-fade",
        className,
      )}
      style={{ animationDelay: `${(order + 1) * STAGGER_MS}ms` }}
    >
      {children}
    </div>
  );
};
