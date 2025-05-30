import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  StatusBadge,
  Table,
  Text,
  toast,
} from "@medusajs/ui";
import { useState } from "react";
import { validateEmail } from "./helpers";
import { useInviteSeller, useSellers } from "../../hooks/api/seller";
import { useNavigate } from "react-router-dom";
import { ActionsButton } from "../../common/ActionsButton";
import { PencilSquare, Shopping, User } from "@medusajs/icons";

const ConfigurationRulesPage = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const { sellers, isLoading } = useSellers({fields: "id,email,name,created_at,status"});

  const { mutateAsync: inviteSeller } = useInviteSeller();

  const navigate = useNavigate();


  const handleInvite = async () => {
    try {
      const isValid = validateEmail(email);
      if (!isValid) {
        return;
      }

      await inviteSeller({ email });
      toast.success("Invited!");
      setOpen(false);
      setEmail("");
    } catch {
      toast.error("Error!");
    }
  };



  return (
    <Container>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Sellers</Heading>
        </div>
        <Drawer
          open={open}
          onOpenChange={(openChanged) => setOpen(openChanged)}
        >
          <Drawer.Trigger
            onClick={() => {
              setOpen(true);
            }}
            asChild
          >
            <Button>Invite</Button>
          </Drawer.Trigger>
          <Drawer.Content>
            <Drawer.Header />
            <Drawer.Body>
            <Heading>Invite Seller</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              Invite a new seller to your store
            </Text>
            <div className="flex flex-col gap-2 mt-6">
              <Label>Email</Label>
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
              <div className="flex justify-end">
                <Button className="mt-6" onClick={handleInvite}>Invite</Button>
              </div>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>
      </div>
      <div className="flex size-full flex-col overflow-hidden">
        {isLoading && <Text>Loading...</Text>}
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Account Status</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sellers?.map(seller => (
              <Table.Row key={seller.id}>
                <Table.Cell
                  onClick={() => navigate(`/admin/sellers/${seller.id}`)}
                  className="cursor-pointer"
                >
                  {seller.email}
                </Table.Cell>
                <Table.Cell
                  onClick={() => navigate(`/admin/sellers/${seller.id}`)}
                  className="cursor-pointer"
                >
                 {seller.name}
                </Table.Cell>
                <Table.Cell
                  onClick={() => navigate(`/admin/sellers/${seller.id}`)}
                  className="cursor-pointer"
                >
                  <StatusBadge color={seller.account_status === "active" ? "green" : "grey"}>
                    {seller.account_status}
                  </StatusBadge>
                </Table.Cell>
                <Table.Cell
                  onClick={() => navigate(`/admin/sellers/${seller.id}`)}
                  className="cursor-pointer"
                >
                  {new Date(seller.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Table.Cell>
                <Table.Cell className="flex justify-end items-center">
                 <ActionsButton
                  actions={[
                    {
                      label: "View",
                      onClick: () => null,
                      icon: <PencilSquare />
                    },
                    {
                      label: "Suspend account",
                      onClick: () => null,
                      icon: <User />
                    }
                  ]}
                />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Sellers",
  icon: Shopping,
});

export default ConfigurationRulesPage;
