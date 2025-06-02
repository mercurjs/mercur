import { Container, Divider, Heading, Text } from "@medusajs/ui";
import { SellerStatusBadge } from "../../../../components/seller-status-badge/SellerStatusBagde";
import { ActionsButton } from "../../../../common/ActionsButton";
import { PencilSquare, User } from "@medusajs/icons";
import { useNavigate } from "react-router-dom";

export const SellerGeneralSection = ({ seller }: { seller: any }) => {

  const navigate = useNavigate();

  return (
    <>
      <div>
        <Container className="mb-2">
          <div className="flex items-center justify-between">
            <Heading>{seller.email || seller.name}</Heading>
            <div className="flex items-center gap-2">
              <SellerStatusBadge status={seller.status || 'pending'} />
              <ActionsButton
                actions={[
                  {
                    label: "Edit",
                    onClick: () => navigate(`/sellers/${seller.id}/edit`),
                    icon: <PencilSquare />
                  },
                  {
                    label: "Suspend account",
                    onClick: () => null,
                    icon: <User />
                  }
                ]}
              />
            </div>
          </div>
        </Container>
      </div>
      <div className="flex gap-4">
        <Container className="px-0">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <Heading>Store</Heading>
            </div>
          </div>
          <div>
            <Divider />
            <div className="px-8 py-4 flex">
              <Text className="font-medium text-ui-fg-subtle w-1/2">Name</Text>
              <Text className="w-1/2">{seller.name}</Text>
            </div>
            <Divider />
            <div className="px-8 py-4 flex">
              <Text className="font-medium text-ui-fg-subtle w-1/2">Email</Text>
              <Text className="w-1/2">{seller.email}</Text>
            </div>
            <Divider />
            <div className="px-8 py-4 flex">
              <Text className="font-medium text-ui-fg-subtle w-1/2">Phone</Text>
              <Text className="w-1/2">{seller.phone}</Text>
            </div>
            <Divider />
            <div className="px-8 py-4 flex">
              <Text className="font-medium text-ui-fg-subtle w-1/2">Description</Text>
              <Text className="w-1/2">{seller.description}</Text>
            </div>
          </div>
        </Container>
        <Container className="px-0">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <Heading>Address</Heading>
            </div>
          </div>
          <div>
            <Divider />
            <div className="px-8 py-4 flex">
              <Text className="font-medium text-ui-fg-subtle w-1/2">Address</Text>
              <Text className="w-1/2">{seller.address}</Text>
            </div>
            <Divider />
            <div className="px-8 py-4 flex">
              <Text className="font-medium text-ui-fg-subtle w-1/2">Postal Code</Text>
              <Text className="w-1/2">{seller.postal_code}</Text>
            </div>
            <Divider />
            <div className="px-8 py-4 flex">
              <Text className="font-medium text-ui-fg-subtle w-1/2">City</Text>
              <Text className="w-1/2">{seller.city}</Text>
            </div>
            <Divider />
            <div className="px-8 py-4 flex">
              <Text className="font-medium text-ui-fg-subtle w-1/2">Country</Text>
              <Text className="w-1/2">{seller.country}</Text>
            </div>
            <Divider />
            <div className="px-8 py-4 flex">
              <Text className="font-medium text-ui-fg-subtle w-1/2">TaxID</Text>
              <Text className="w-1/2">{seller.tax_id}</Text>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
};