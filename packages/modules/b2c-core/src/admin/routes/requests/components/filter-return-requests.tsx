import { CircleFilledSolid } from "@medusajs/icons";
import { Button, DropdownMenu } from "@medusajs/ui";
import { useState } from "react";

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
    <div className="my-2">
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <Button variant="secondary">Filter</Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content className="w-[300px]">
          <DropdownMenu.RadioGroup
            value={value}
            onValueChange={(v) => handleChange(v as FilterState)}
          >
            <DropdownMenu.RadioItem value="">No filter</DropdownMenu.RadioItem>
            <DropdownMenu.Separator />
            <DropdownMenu.RadioItem value="pending">
              Pending
              <DropdownMenu.Hint>
                <CircleFilledSolid color="orange" />
              </DropdownMenu.Hint>
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="escalated">
              Escalated
              <DropdownMenu.Hint>
                <CircleFilledSolid color="orange" />
              </DropdownMenu.Hint>
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="refunded">
              Refunded
              <DropdownMenu.Hint>
                <CircleFilledSolid color="green" />
              </DropdownMenu.Hint>
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="withdrawn">
              Withdrawn
              <DropdownMenu.Hint>
                <CircleFilledSolid color="green" />
              </DropdownMenu.Hint>
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="canceled">
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
