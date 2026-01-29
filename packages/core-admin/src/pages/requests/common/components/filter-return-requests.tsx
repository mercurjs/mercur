import { useState } from "react";

import { CircleFilledSolid } from "@medusajs/icons";
import { Button, DropdownMenu } from "@medusajs/ui";

export type FilterState =
  | ""
  | "pending"
  | "refunded"
  | "withdrawn"
  | "escalated"
  | "canceled";

type Props = {
  onChange: (value: FilterState) => void;
  defaultState?: FilterState;
};

export function FilterReturnRequests({ onChange, defaultState = "" }: Props) {
  const [value, setValue] = useState<FilterState>(defaultState);

  const handleChange = (value: FilterState) => {
    setValue(value);
    onChange(value);
  };

  return (
    <div className="my-2" data-testid="filter-return-requests">
      <DropdownMenu data-testid="filter-return-requests-dropdown">
        <DropdownMenu.Trigger asChild>
          <Button variant="secondary" data-testid="filter-return-requests-button">Filter</Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content className="w-[300px]" data-testid="filter-return-requests-content">
          <DropdownMenu.RadioGroup
            value={value}
            onValueChange={(v) => handleChange(v as FilterState)}
            data-testid="filter-return-requests-radio-group"
          >
            <DropdownMenu.RadioItem value="" data-testid="filter-return-requests-option-no-filter">No filter</DropdownMenu.RadioItem>
            <DropdownMenu.Separator />
            <DropdownMenu.RadioItem value="pending" data-testid="filter-return-requests-option-pending">
              Pending
              <DropdownMenu.Hint>
                <CircleFilledSolid color="orange" />
              </DropdownMenu.Hint>
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="escalated" data-testid="filter-return-requests-option-escalated">
              Escalated
              <DropdownMenu.Hint>
                <CircleFilledSolid color="orange" />
              </DropdownMenu.Hint>
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="refunded" data-testid="filter-return-requests-option-refunded">
              Refunded
              <DropdownMenu.Hint>
                <CircleFilledSolid color="green" />
              </DropdownMenu.Hint>
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="withdrawn" data-testid="filter-return-requests-option-withdrawn">
              Withdrawn
              <DropdownMenu.Hint>
                <CircleFilledSolid color="green" />
              </DropdownMenu.Hint>
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="canceled" data-testid="filter-return-requests-option-canceled">
              Canceled
              <DropdownMenu.Hint>
                <CircleFilledSolid color="red" />
              </DropdownMenu.Hint>
            </DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu>
    </div>
  );
}
