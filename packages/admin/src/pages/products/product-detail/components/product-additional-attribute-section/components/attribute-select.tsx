import { Select } from '@medusajs/ui';

export const AttributeSelect = ({
  values,
  field,
  'data-testid': dataTestId
}: {
  values: any[];
  field: any;
  'data-testid'?: string;
}) => {
  const handleChange = (value: string) => {
    field.onChange({
      target: {
        name: field.name,
        value: value
      }
    });
  };

  return (
    <div data-testid={dataTestId ? `${dataTestId}-wrapper` : undefined}>
      <Select
        onValueChange={value => handleChange(value)}
        value={field.value}
        data-testid={dataTestId}
      >
        <Select.Trigger
          className="bg-ui-bg-base"
          data-testid={dataTestId ? `${dataTestId}-trigger` : undefined}
        >
          <Select.Value
            placeholder="Select value"
            data-testid={dataTestId ? `${dataTestId}-value` : undefined}
          />
        </Select.Trigger>
        <Select.Content data-testid={dataTestId ? `${dataTestId}-content` : undefined}>
          {values
            ?.filter(v => v && v.attribute_id)
            .map(({ id, attribute_id, value }) => (
              <Select.Item
                key={`select-option-${attribute_id}-${id}`}
                value={value}
                data-testid={dataTestId ? `${dataTestId}-option-${id}` : undefined}
              >
                {value}
              </Select.Item>
            ))}
        </Select.Content>
      </Select>
    </div>
  );
};
