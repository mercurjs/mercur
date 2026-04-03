import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Text, clx } from "@medusajs/ui";
import {
  CheckCircleSolid,
  TriangleDownMini,
  CircleDottedLine,
} from "@medusajs/icons";
import { Collapsible as RadixCollapsible } from "radix-ui";

import { SellerDTO } from "@mercurjs/types";

type ProfileStep = {
  key: string;
  label: string;
  completed: boolean;
  path: string;
};

function getProfileSteps(seller: SellerDTO): ProfileStep[] {
  const hasStoreDetails = !!(seller.name && seller.email && seller.description);

  const hasAddress = !!(
    seller.address &&
    seller.address.address_1 &&
    seller.address.city &&
    seller.address.country_code
  );

  const hasCompanyDetails = !!(
    seller.professional_details && seller.professional_details.corporate_name
  );

  const hasPaymentDetails = !!(
    seller.payment_details &&
    seller.payment_details.holder_name &&
    seller.payment_details.country_code
  );

  return [
    {
      key: "store_details",
      label: "Add store details",
      completed: hasStoreDetails,
      path: "/settings/store/edit",
    },
    {
      key: "address",
      label: "Add address",
      completed: hasAddress,
      path: "/settings/store/address",
    },
    {
      key: "company_details",
      label: "Add company details",
      completed: hasCompanyDetails,
      path: "/settings/store/professional-details",
    },
    {
      key: "payment_details",
      label: "Add payment details",
      completed: hasPaymentDetails,
      path: "/settings/store/payment-details",
    },
  ];
}

const StoreSetup = ({ seller }: { seller: SellerDTO }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const steps = useMemo(() => getProfileSteps(seller), [seller]);

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const progressPercent = (completedCount / totalCount) * 100;

  if (completedCount === totalCount) {
    return null;
  }

  return (
    <RadixCollapsible.Root open={open} onOpenChange={setOpen}>
      <Container className="overflow-hidden p-0">
        <div
          className="h-1 bg-ui-tag-green-icon transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
        <div className="p-6">
          <RadixCollapsible.Trigger asChild>
            <button className="flex w-full items-center justify-between">
              <Text size="large" weight="plus" leading="compact">
                Complete store profile
              </Text>
              <TriangleDownMini
                className={clx(
                  "text-ui-fg-muted transition-transform duration-200",
                  !open && "-rotate-90",
                )}
              />
            </button>
          </RadixCollapsible.Trigger>

          <RadixCollapsible.Content>
            <div className="mt-4 flex flex-col gap-y-3">
              {steps.map((step) => (
                <button
                  key={step.key}
                  className="flex items-center gap-x-3 text-left"
                  onClick={() => {
                    if (!step.completed) {
                      navigate(step.path);
                    }
                  }}
                  disabled={step.completed}
                >
                  {step.completed ? (
                    <CheckCircleSolid className="text-ui-tag-green-icon shrink-0" />
                  ) : (
                    <CircleDottedLine className="text-ui-fg-muted shrink-0" />
                  )}
                  <Text
                    size="small"
                    leading="compact"
                    className={clx(
                      step.completed ? "text-ui-fg-base" : "text-ui-fg-base",
                    )}
                  >
                    {step.label}
                  </Text>
                </button>
              ))}
            </div>
          </RadixCollapsible.Content>
        </div>
      </Container>
    </RadixCollapsible.Root>
  );
};

export default StoreSetup;
