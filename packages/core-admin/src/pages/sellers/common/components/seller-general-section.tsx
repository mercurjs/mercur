import { PencilSquare, User } from "@medusajs/icons";
import { Container, Divider, Heading, Text, usePrompt } from "@medusajs/ui";

import { useNavigate } from "react-router-dom";

import type { VendorSeller } from "@custom-types/seller";

import { ActionsButton } from "@components/common/actions-button";
import { SellerStatusBadge } from "@components/common/seller-status-badge";

import { useUpdateSeller } from "@hooks/api/sellers";

export const SellerGeneralSection = ({ seller }: { seller: VendorSeller }) => {
  const navigate = useNavigate();

  const { mutateAsync: suspendSeller } = useUpdateSeller();

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
      <div>
        <Container className="mb-2" data-testid="seller-general-section-header">
          <div className="flex items-center justify-between">
            <Heading data-testid="seller-general-section-name">{seller.email || seller.name}</Heading>
            <div className="flex items-center gap-2">
              <SellerStatusBadge status={seller.store_status || "pending"} data-testid="seller-general-section-status-badge" />
              <ActionsButton
                data-testid="seller-general-section-action-menu"
                actions={[
                  {
                    label: "Edit",
                    onClick: () => navigate(`/sellers/${seller.id}/edit`),
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
                ]}
              />
            </div>
          </div>
        </Container>
      </div>
      <div className="flex gap-4">
        <Container className="px-0" data-testid="seller-general-section-store">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <Heading data-testid="seller-general-section-store-heading">Store</Heading>
            </div>
          </div>
          <div>
            <Divider />
            <div className="flex px-8 py-4" data-testid="seller-general-section-store-name-row">
              <Text className="w-1/2 font-medium text-ui-fg-subtle" data-testid="seller-general-section-store-name-label">Name</Text>
              <Text className="w-1/2" data-testid="seller-general-section-store-name-value">{seller.name}</Text>
            </div>
            <Divider />
            <div className="flex px-8 py-4" data-testid="seller-general-section-store-email-row">
              <Text className="w-1/2 font-medium text-ui-fg-subtle" data-testid="seller-general-section-store-email-label">Email</Text>
              <Text className="w-1/2" data-testid="seller-general-section-store-email-value">{seller.email}</Text>
            </div>
            <Divider />
            <div className="flex px-8 py-4" data-testid="seller-general-section-store-phone-row">
              <Text className="w-1/2 font-medium text-ui-fg-subtle" data-testid="seller-general-section-store-phone-label">Phone</Text>
              <Text className="w-1/2" data-testid="seller-general-section-store-phone-value">{seller.phone}</Text>
            </div>
            <Divider />
            <div className="flex px-8 py-4" data-testid="seller-general-section-store-description-row">
              <Text className="w-1/2 font-medium text-ui-fg-subtle" data-testid="seller-general-section-store-description-label">
                Description
              </Text>
              <Text className="w-1/2" data-testid="seller-general-section-store-description-value">{seller.description}</Text>
            </div>
          </div>
        </Container>
        <Container className="px-0" data-testid="seller-general-section-address">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <Heading data-testid="seller-general-section-address-heading">Address</Heading>
            </div>
          </div>
          <div>
            <Divider />
            <div className="flex px-8 py-4" data-testid="seller-general-section-address-line-row">
              <Text className="w-1/2 font-medium text-ui-fg-subtle" data-testid="seller-general-section-address-line-label">
                Address
              </Text>
              <Text className="w-1/2" data-testid="seller-general-section-address-line-value">{seller.address_line}</Text>
            </div>
            <Divider />
            <div className="flex px-8 py-4" data-testid="seller-general-section-postal-code-row">
              <Text className="w-1/2 font-medium text-ui-fg-subtle" data-testid="seller-general-section-postal-code-label">
                Postal Code
              </Text>
              <Text className="w-1/2" data-testid="seller-general-section-postal-code-value">{seller.postal_code}</Text>
            </div>
            <Divider />
            <div className="flex px-8 py-4" data-testid="seller-general-section-city-row">
              <Text className="w-1/2 font-medium text-ui-fg-subtle" data-testid="seller-general-section-city-label">City</Text>
              <Text className="w-1/2" data-testid="seller-general-section-city-value">{seller.city}</Text>
            </div>
            <Divider />
            <div className="flex px-8 py-4" data-testid="seller-general-section-country-row">
              <Text className="w-1/2 font-medium text-ui-fg-subtle" data-testid="seller-general-section-country-label">
                Country
              </Text>
              <Text className="w-1/2" data-testid="seller-general-section-country-value">{seller.country_code}</Text>
            </div>
            <Divider />
            <div className="flex px-8 py-4" data-testid="seller-general-section-tax-id-row">
              <Text className="w-1/2 font-medium text-ui-fg-subtle" data-testid="seller-general-section-tax-id-label">TaxID</Text>
              <Text className="w-1/2" data-testid="seller-general-section-tax-id-value">{seller.tax_id}</Text>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
};
