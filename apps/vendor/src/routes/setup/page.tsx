import { useMemo } from "react";
import {
  RocketLaunch,
  CheckCircleSolid,
  CircleDottedLine,
  Spinner,
} from "@medusajs/icons";
import { Button, Heading, Text, clx } from "@medusajs/ui";
import { useNavigate } from "react-router-dom";

import type { RouteConfig } from "@mercurjs/dashboard-sdk";
import { useMe } from "../../hooks/use-me";

export const config: RouteConfig = {
  label: "Setup",
  icon: RocketLaunch,
};

type SetupStep = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action: {
    label: string;
    to: string;
  };
  isNext?: boolean;
};

function SetupStepRow({ step }: { step: SetupStep }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-start gap-x-4 py-6">
      <div className="shrink-0 pt-0.5">
        {step.completed ? (
          <CheckCircleSolid className="h-6 w-6 text-green-500" />
        ) : (
          <CircleDottedLine className="text-ui-fg-muted h-6 w-6" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-y-0.5">
        <Text
          size="small"
          weight="plus"
          className={clx(!step.completed && !step.isNext && "text-ui-fg-muted")}
        >
          {step.title}
        </Text>
        <Text
          size="small"
          className={clx(
            "text-ui-fg-subtle max-w-[460px]",
            !step.completed && !step.isNext && "text-ui-fg-muted",
          )}
        >
          {step.description}
        </Text>
      </div>
      <div className="shrink-0 pt-0.5">
        <Button
          variant={step.isNext ? "primary" : "secondary"}
          size="small"
          onClick={() => navigate(step.action.to)}
        >
          {step.action.label}
        </Button>
      </div>
    </div>
  );
}

function SetupPageSkeleton() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Spinner className="text-ui-fg-muted animate-spin" />
    </div>
  );
}

export default function SetupPage() {
  const { seller_member, isPending, isError, error } = useMe();
  const seller = seller_member?.seller;

  const steps = useMemo((): SetupStep[] => {
    if (!seller) return [];

    const hasCompanyProfile = !!(seller.description && seller.logo);
    const hasAddress = !!seller.address;
    const hasPaymentInfo = !!seller.payment_details;

    const steps: SetupStep[] = [
      {
        id: "account",
        title: "Store created",
        description: "You're ready to start setting up your store.",
        completed: true,
        action: {
          label: "View store",
          to: "/settings/store",
        },
      },
      {
        id: "company-profile",
        title: "Complete company profile",
        description:
          "Add your store name, description, logo, and other details so customers can find and trust your store.",
        completed: hasCompanyProfile,
        action: {
          label: hasCompanyProfile ? "Edit" : "Get started",
          to: "/settings/store/edit",
        },
      },
      {
        id: "business-address",
        title: "Business address",
        description:
          "Provide your business address for shipping calculations and tax compliance.",
        completed: hasAddress,
        action: {
          label: hasAddress ? "Edit" : "Get started",
          to: "/settings/store/address",
        },
      },
      {
        id: "payment-info",
        title: "Add payment information",
        description:
          "Set up your bank account or payment method to receive payouts from your sales.",
        completed: hasPaymentInfo,
        action: {
          label: hasPaymentInfo ? "Edit" : "Get started",
          to: "/settings/store/payment-details",
        },
      },
    ];

    let foundNext = false;
    return steps.map((step) => {
      if (!step.completed && !foundNext) {
        foundNext = true;
        return { ...step, isNext: true };
      }
      return step;
    });
  }, [seller]);

  if (isPending) {
    return <SetupPageSkeleton />;
  }

  if (isError) {
    throw error;
  }

  return (
    <div className="mx-auto max-w-[720px] py-8">
      <Heading level="h1" className="mb-1">
        Welcome!
      </Heading>
      <Text className="text-ui-fg-subtle mb-8" size="small">
        Complete these steps to get your store approved.
      </Text>

      <div className="divide-y divide-ui-border-base">
        {steps.map((step) => (
          <SetupStepRow key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}
