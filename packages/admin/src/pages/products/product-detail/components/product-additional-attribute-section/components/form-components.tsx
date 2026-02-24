import { Input, Switch, Textarea } from "@medusajs/ui";
import { AttributeSelect } from "./attribute-select";

export const FormComponents = ({
  attribute,
  field,
  "data-testid": dataTestId,
}: {
  attribute: any;
  field: any;
  "data-testid"?: string;
}) => {
  const { ui_component, possible_values } = attribute;

  if (ui_component === "select")
    return <AttributeSelect values={possible_values} field={field} data-testid={dataTestId} />;

  if (ui_component === "toggle")
    return (
      <div data-testid={dataTestId ? `${dataTestId}-switch-wrapper` : undefined}>
        <Switch
          name={field.name}
          onCheckedChange={(value) => {
            field.onChange({
              target: {
                name: field.name,
                value: value,
              },
            });
          }}
          checked={field.value === "true" || field.value === true}
          data-testid={dataTestId}
        />
      </div>
    );

  if (ui_component === "text_area")
    return (
      <div data-testid={dataTestId ? `${dataTestId}-textarea-wrapper` : undefined}>
        <Textarea {...field} rows={4} data-testid={dataTestId} />
      </div>
    );

  if (ui_component === "unit")
    return (
      <div data-testid={dataTestId ? `${dataTestId}-input-wrapper` : undefined}>
        <Input type="number" {...field} data-testid={dataTestId} />
      </div>
    );

  if (ui_component === "text")
    return (
      <div data-testid={dataTestId ? `${dataTestId}-input-wrapper` : undefined}>
        <Input {...field} data-testid={dataTestId} />
      </div>
    );

  return (
    <div data-testid={dataTestId ? `${dataTestId}-input-wrapper` : undefined}>
      <Input {...field} data-testid={dataTestId} />
    </div>
  );
};
