import { CircleFilledSolid } from "@medusajs/icons";
import { Button, DropdownMenu } from "@medusajs/ui";
import { useState } from "react";

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
            <DropdownMenu.RadioItem value="accepted">
              Accepted
              <DropdownMenu.Hint>
                <CircleFilledSolid color="green" />
              </DropdownMenu.Hint>
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="rejected">
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
