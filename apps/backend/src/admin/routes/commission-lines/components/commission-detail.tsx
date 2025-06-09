import { Container, Drawer, Text, Button } from "@medusajs/ui";
import { useNavigate } from "react-router-dom";

import { CommissionLine } from "../types";

type Props = {
  line?: CommissionLine;
  open: boolean;
  close: () => void;
};

export function CommissionLineDetail({ line, open, close }: Props) {
  const navigate = useNavigate();

  if (!line) {
    return null;
  }

  return (
    <Drawer open={open} onOpenChange={close}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Commission line details</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-4">
          <fieldset>
            <legend className="mb-2">Seller name</legend>
            <Container>
              <div className="flex items-center justify-between">
                <Text>{line.order.seller.name}</Text>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => navigate(`/sellers/${line.order.seller.id}`)}
                >
                  View Seller
                </Button>
              </div>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mt-4">Order number</legend>
            <Container>
              <div className="flex items-center justify-between">
                <Text>{`#${line.order.display_id}`}</Text>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => navigate(`/orders/${line.order.id}`)}
                >
                  View Order
                </Button>
              </div>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mt-4">Commission value</legend>
            <Container>
              <div className="flex items-center justify-between">
                <Text>{`${line.value} ${line.currency_code.toUpperCase()}`}</Text>
              </div>
            </Container>
          </fieldset>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  );
}
