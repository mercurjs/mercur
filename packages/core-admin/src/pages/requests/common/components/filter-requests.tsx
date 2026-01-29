import { useState } from "react";

import { CircleFilledSolid } from "@medusajs/icons";
import { Button, DropdownMenu } from "@medusajs/ui";

export type FilterState = "accepted" | "rejected" | "pending" | "";

type Props = {
  onChange: (value: FilterState) => void;
};

export function FilterRequests({ onChange }: Props) {
  const [value, setValue] = useState<FilterState>("");

  const handleChange = (value: FilterState) => {
    setValue(value);
    onChange(value);
  };

  return (
    <div className="my-2" data-testid="filter-requests">
      <DropdownMenu data-testid="filter-requests-dropdown">
        <DropdownMenu.Trigger asChild>
          <Button variant="secondary" data-testid="filter-requests-button">Filter</Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content className="w-[300px]" data-testid="filter-requests-content">
          <DropdownMenu.RadioGroup
            value={value}
            onValueChange={(v) => handleChange(v as FilterState)}
            data-testid="filter-requests-radio-group"
          >
            <DropdownMenu.RadioItem value="" data-testid="filter-requests-option-no-filter">No filter</DropdownMenu.RadioItem>
            <DropdownMenu.Separator />
            <DropdownMenu.RadioItem value="pending" data-testid="filter-requests-option-pending">
              Pending
              <DropdownMenu.Hint>
                <CircleFilledSolid color="orange" />
              </DropdownMenu.Hint>
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="accepted" data-testid="filter-requests-option-accepted">
              Accepted
              <DropdownMenu.Hint>
                <CircleFilledSolid color="green" />
              </DropdownMenu.Hint>
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="rejected" data-testid="filter-requests-option-rejected">
              Rejected
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
