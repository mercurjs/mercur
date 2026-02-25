import { PencilSquare, User } from "@medusajs/icons";
import { Badge, Container, Heading, Text, usePrompt } from "@medusajs/ui";

import type { VendorSeller } from "@custom-types/seller";

import { ActionMenu } from "../../../../components/common/action-menu";

import { SellerStatus } from "@mercurjs/types";
import { useUpdateSeller } from "@/hooks/api";

const getStatusBadgeColor = (status: string) => {
  const colors: Record<string, "orange" | "green" | "red"> = {
    [SellerStatus.PENDING]: "orange",
    [SellerStatus.ACTIVE]: "green",
    [SellerStatus.SUSPENDED]: "red",
  };
  return colors[status] || "orange";
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    [SellerStatus.PENDING]: "Pending",
    [SellerStatus.ACTIVE]: "Active",
    [SellerStatus.SUSPENDED]: "Suspended",
  };
  return labels[status] || "Pending";
};

export const SellerGeneralSection = ({ seller }: { seller: VendorSeller }) => {
  const { mutateAsync: suspendSeller } = useUpdateSeller(seller.id);

  const dialog = usePrompt();

  const handleSuspend = async () => {
    const res = await dialog({
      title:
        seller.store_status === "SUSPENDED"
          ? "Activate account"
          : "Suspend account",
      description:
        seller.store_status === "SUSPENDED"
          ? "Are you sure you want to activate this account?"
          : "Are you sure you want to suspend this account?",
      verificationText: seller.email || seller.name || "",
    });

    if (!res) {
      return;
    }

    if (seller.store_status === "SUSPENDED") {
      await suspendSeller({ id: seller.id, data: { store_status: "ACTIVE" } });
    } else {
      await suspendSeller({
        id: seller.id,
        data: { store_status: "SUSPENDED" },
      });
    }
  };

  return (
    <>
      <Container
        className="mb-2 divide-y p-0"
        data-testid="seller-general-section-header"
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading data-testid="seller-general-section-name">
              {seller.email || seller.name}
            </Heading>
            <div className="flex items-center gap-x-2 mt-1">
              <Badge
                size="2xsmall"
                color={getStatusBadgeColor(seller.store_status || "pending")}
                data-testid="seller-general-section-status-badge"
              >
                {getStatusLabel(seller.store_status || "pending")}
              </Badge>
            </div>
          </div>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: "Edit",
                    to: `/sellers/${seller.id}/edit`,
                    icon: <PencilSquare />,
                  },
                  {
                    label:
                      seller.store_status === "SUSPENDED"
                        ? "Activate account"
                        : "Suspend account",
                    onClick: () => handleSuspend(),
                    icon: <User />,
                  },
                ],
              },
            ]}
            data-testid="seller-general-section-action-menu"
          />
        </div>
      </Container>
      <div className="flex gap-4">
        <Container
          className="divide-y p-0"
          data-testid="seller-general-section-store"
        >
          <div className="flex items-center justify-between px-6 py-4">
            <Heading
              level="h2"
              data-testid="seller-general-section-store-heading"
            >
              Store
            </Heading>
          </div>
          <div
            className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4"
            data-testid="seller-general-section-store-name-row"
          >
            <Text
              size="small"
              leading="compact"
              weight="plus"
              data-testid="seller-general-section-store-name-label"
            >
              Name
            </Text>
            <Text
              size="small"
              leading="compact"
              data-testid="seller-general-section-store-name-value"
            >
              {seller.name}
            </Text>
          </div>
          <div
            className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4"
            data-testid="seller-general-section-store-email-row"
          >
            <Text
              size="small"
              leading="compact"
              weight="plus"
              data-testid="seller-general-section-store-email-label"
            >
              Email
            </Text>
            <Text
              size="small"
              leading="compact"
              data-testid="seller-general-section-store-email-value"
            >
              {seller.email}
            </Text>
          </div>
          <div
            className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4"
            data-testid="seller-general-section-store-phone-row"
          >
            <Text
              size="small"
              leading="compact"
              weight="plus"
              data-testid="seller-general-section-store-phone-label"
            >
              Phone
            </Text>
            <Text
              size="small"
              leading="compact"
              data-testid="seller-general-section-store-phone-value"
            >
              {seller.phone || "-"}
            </Text>
          </div>
          <div
            className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4"
            data-testid="seller-general-section-store-description-row"
          >
            <Text
              size="small"
              leading="compact"
              weight="plus"
              data-testid="seller-general-section-store-description-label"
            >
              Description
            </Text>
            <Text
              size="small"
              leading="compact"
              data-testid="seller-general-section-store-description-value"
            >
              {seller.description || "-"}
            </Text>
          </div>
        </Container>
        <Container
          className="divide-y p-0"
          data-testid="seller-general-section-address"
        >
          <div className="flex items-center justify-between px-6 py-4">
            <Heading
              level="h2"
              data-testid="seller-general-section-address-heading"
            >
              Address
            </Heading>
          </div>
          <div
            className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4"
            data-testid="seller-general-section-address-line-row"
          >
            <Text
              size="small"
              leading="compact"
              weight="plus"
              data-testid="seller-general-section-address-line-label"
            >
              Address
            </Text>
            <Text
              size="small"
              leading="compact"
              data-testid="seller-general-section-address-line-value"
            >
              {seller.address_line || "-"}
            </Text>
          </div>
          <div
            className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4"
            data-testid="seller-general-section-postal-code-row"
          >
            <Text
              size="small"
              leading="compact"
              weight="plus"
              data-testid="seller-general-section-postal-code-label"
            >
              Postal Code
            </Text>
            <Text
              size="small"
              leading="compact"
              data-testid="seller-general-section-postal-code-value"
            >
              {seller.postal_code || "-"}
            </Text>
          </div>
          <div
            className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4"
            data-testid="seller-general-section-city-row"
          >
            <Text
              size="small"
              leading="compact"
              weight="plus"
              data-testid="seller-general-section-city-label"
            >
              City
            </Text>
            <Text
              size="small"
              leading="compact"
              data-testid="seller-general-section-city-value"
            >
              {seller.city || "-"}
            </Text>
          </div>
          <div
            className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4"
            data-testid="seller-general-section-country-row"
          >
            <Text
              size="small"
              leading="compact"
              weight="plus"
              data-testid="seller-general-section-country-label"
            >
              Country
            </Text>
            <Text
              size="small"
              leading="compact"
              data-testid="seller-general-section-country-value"
            >
              {seller.country_code || "-"}
            </Text>
          </div>
          <div
            className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4"
            data-testid="seller-general-section-tax-id-row"
          >
            <Text
              size="small"
              leading="compact"
              weight="plus"
              data-testid="seller-general-section-tax-id-label"
            >
              TaxID
            </Text>
            <Text
              size="small"
              leading="compact"
              data-testid="seller-general-section-tax-id-value"
            >
              {seller.tax_id || "-"}
            </Text>
          </div>
        </Container>
      </div>
    </>
  );
};
