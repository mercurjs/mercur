import type { CommissionLine } from '@custom-types/commission';
import { Button, Container, Drawer, Text } from '@medusajs/ui';
import { useNavigate } from 'react-router-dom';

import { formatDate } from '@/lib/date';

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
    <Drawer
      open={open}
      onOpenChange={close}
      data-testid="commission-line-detail-drawer"
    >
      <Drawer.Content data-testid="commission-line-detail-drawer-content">
        <Drawer.Header data-testid="commission-line-detail-drawer-header">
          <Drawer.Title data-testid="commission-line-detail-drawer-title">
            Commission line details
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body
          className="p-4"
          data-testid="commission-line-detail-drawer-body"
        >
          <fieldset data-testid="commission-line-detail-seller-fieldset">
            <legend
              className="mb-2"
              data-testid="commission-line-detail-seller-legend"
            >
              Seller name
            </legend>
            <Container data-testid="commission-line-detail-seller-container">
              <div
                className="flex items-center justify-between"
                data-testid="commission-line-detail-seller-content"
              >
                <Text data-testid="commission-line-detail-seller-name">
                  {line.order?.seller?.name ?? '-'}
                </Text>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => navigate(`/sellers/${line.order?.seller?.id ?? ''}`)}
                  disabled={!line.order?.seller?.id}
                  data-testid="commission-line-detail-view-seller-button"
                >
                  View Seller
                </Button>
              </div>
            </Container>
          </fieldset>
          <fieldset
            className="mt-2"
            data-testid="commission-line-detail-order-fieldset"
          >
            <legend
              className="mt-4"
              data-testid="commission-line-detail-order-legend"
            >
              Order number
            </legend>
            <Container data-testid="commission-line-detail-order-container">
              <div
                className="flex items-center justify-between"
                data-testid="commission-line-detail-order-content"
              >
                <Text data-testid="commission-line-detail-order-number">
                  {line.order?.display_id ? `#${line.order?.display_id}` : '-'}
                </Text>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => navigate(`/orders/${line.order?.id}`)}
                  disabled={!line.order?.id}
                  data-testid="commission-line-detail-view-order-button"
                >
                  View Order
                </Button>
              </div>
            </Container>
          </fieldset>
          <fieldset
            className="mt-2"
            data-testid="commission-line-detail-value-fieldset"
          >
            <legend
              className="mt-4"
              data-testid="commission-line-detail-value-legend"
            >
              Calculated commission value
            </legend>
            <Container data-testid="commission-line-detail-value-container">
              <div
                className="flex items-center justify-between"
                data-testid="commission-line-detail-value-content"
              >
                <Text data-testid="commission-line-detail-value-text">{`${line.value === null ? '-' : line.value.toFixed(2)} ${line.currency_code.toUpperCase()}`}</Text>
              </div>
            </Container>
          </fieldset>
          <fieldset
            className="mt-2"
            data-testid="commission-line-detail-rate-fieldset"
          >
            <legend
              className="mt-4"
              data-testid="commission-line-detail-rate-legend"
            >
              Rate details
            </legend>
            <Container data-testid="commission-line-detail-rate-container">
              <div
                className="flex flex-col gap-2"
                data-testid="commission-line-detail-rate-content"
              >
                <Text data-testid="commission-line-detail-rate-name">{`Rule name: ${line.rule?.name ?? '-'}`}</Text>
                <Text data-testid="commission-line-detail-rate-reference">{`Reference: ${line.rule?.reference ?? '-'}`}</Text>
                <Text data-testid="commission-line-detail-rate-type">{`Type: ${line.rule?.rate?.type ?? '-'}`}</Text>
                {line.rule?.rate.type === 'percentage' && (
                  <>
                    <Text data-testid="commission-line-detail-rate-value">{`Rate value: ${line.rule?.rate?.percentage_rate ?? '-'} ${line.rule?.rate?.percentage_rate ? '%' : ''}`}</Text>
                    <Text data-testid="commission-line-detail-rate-include-tax">{`Include tax: ${line.rule?.rate?.include_tax ? 'Yes' : 'No'}`}</Text>
                  </>
                )}
                {line.rule?.deleted_at && (
                  <Text
                    size="large"
                    weight="plus"
                    data-testid="commission-line-detail-rate-deleted"
                  >{`Rule was deleted at ${formatDate(line.rule?.deleted_at)}`}</Text>
                )}
              </div>
            </Container>
          </fieldset>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  );
}
