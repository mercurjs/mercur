export type BaseField = {
    type: 'string'
    | 'text'
    | 'integer'
    | 'boolean'
    | 'date'
    | 'time'
    | 'datetime'
    | 'json'
    | 'array'
    | 'float',
    nullable?: boolean,
    defaultValue?: any
}

export type EnumField = Omit<BaseField, 'type'> & {
    type: 'enum',
    enum: string[],
}

export type Field = BaseField | EnumField

export type CustomFieldsModuleOptions = { customFields?: { [K in string]?: Record<string, Field> } }
