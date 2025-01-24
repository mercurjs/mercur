import { Switch, Label, Container, Text, Tooltip } from "@medusajs/ui";
import { InformationCircleSolid } from "@medusajs/icons";

const CoolSwitch = ({
  checked,
  onChange,
  fieldName,
  label,
  description,
  tooltip,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  fieldName: string;
  label: string;
  description: string;
  tooltip?: string;
}) => {
  return (
    <Container className="bg-ui-bg-subtle flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Switch name={fieldName} checked={checked} onCheckedChange={onChange} />
        <Label size="xsmall" className="txt-compact-small font-medium">
          {label}
        </Label>
        {tooltip && (
          <Tooltip content={tooltip} className="z-50">
            <InformationCircleSolid color="gray" />
          </Tooltip>
        )}
      </div>
      <Text size="xsmall">{description}</Text>
    </Container>
  );
};

export { CoolSwitch };
