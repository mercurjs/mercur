import { AttributeUIComponent } from "./common";

/**
 * @interface
 * The attribute value to be created.
 * @property {string} value - The value of the attribute value.
 * @property {number} rank - The rank of the attribute value.
 * @property {string} attribute_id - The associated attribute's ID.
 * @property {Record<string, unknown>} metadata - Holds custom data in key-value pairs.
 */
export interface CreateAttributeValueDTO {
  /**
 * *
 * The value of the attribute value

 */
  value: string;
  /**
 * *
 * The rank of the attribute value

 */
  rank: number;
  /**
 * *
 * The associated attribute's ID.

 */
  attribute_id: string;
  /**
 * *
 * Holds custom data in key-value pairs.

 */
  metadata?: Record<string, unknown>;
}

/**
 * @interface
 * The attributes to update in the attribute.
 * @property {string} id - The ID of the attribute.
 * @property {string} name - The name of the attribute.
 * @property {string} description - The description of the attribute.
 * @property {string} handle - The handle of the attribute.
 * @property {boolean} is_filterable - Whether the attribute is filterable.
 * @property {Record<string, unknown>} metadata - Holds custom data in key-value pairs.
 * @property {string} ui_component - The UI component of the attribute.
 * @property {UpsertAttributeValueDTO[]} possible_values - The possible values of the attribute.
 * @property {string[]} product_category_ids - The product category ids of the attribute.
 */
export interface UpdateAttributeDTO {
  /**
 * *
 * The ID of the attribute.

 */
  id: string;
  /**
 * *
 * The name of the attribute

 */
  name?: string;
  /**
 * *
 * The description of the attribute

 */
  description?: string;
  /**
 * *
 * The handle of the attribute

 */
  handle?: string;
  /**
 * *
 * Whether the attribute is filterable.

 */
  is_filterable?: boolean;
  /**
 * *
 * Holds custom data in key-value pairs.

 */
  metadata?: Record<string, unknown>;
  /**
 * *
 * The possible values of the attribute

 */
  possible_values?: UpsertAttributeValueDTO[];
  /**
 * *
 * The product category ids of the attribute

 */
  product_category_ids?: {
    /**
 * *
 * The ID of the entity.

 */
    id: string;
  }[];
}

/**
 * @interface
 * The attributes in the attribute value to be created or updated.
 * @property {string} id - The ID of the attribute value.
 * @property {string} value - The value of the attribute value.
 * @property {number} rank - The rank of the attribute value.
 * @property {Record<string, unknown>} metadata - Holds custom data in key-value pairs.
 * @property {string} attribute_id - The associated attribute's ID.
 */
export interface UpsertAttributeValueDTO {
  /**
 * *
 * The ID of the attribute value.

 */
  id?: string;
  /**
 * *
 * The value of the attribute value

 */
  value?: string;
  /**
 * *
 * The rank of the attribute value

 */
  rank?: number;
  /**
 * *
 * Holds custom data in key-value pairs.

 */
  metadata?: Record<string, unknown>;
  /**
 * *
 * The associated attribute's ID.

 */
  attribute_id?: string;
}

/**
 * @interface
 * The attribute to be created.
 */
export interface CreateAttributeDTO {
  /**
 * *
 * The name of the attribute

 */
  name: string;
  /**
 * *
 * The description of the attribute

 */
  description?: string;
  /**
 * *
 * The handle of the attribute

 */
  handle?: string;
  /**
 * *
 * Whether the attribute is filterable.

 */
  is_filterable?: boolean;
  /**
 * *
 * Holds custom data in key-value pairs.

 */
  metadata?: Record<string, unknown>;
  /**
 * *
 * The ui component of the attribute

 */
  ui_component: AttributeUIComponent;
  /**
 * *
 * The possible values of the attribute

 */
  possible_values?: Omit<CreateAttributeValueDTO, "attribute_id">[];
  /**
 * *
 * The product category ids of the attribute

 */
  product_category_ids?: string[];
}

/**
 * @interface
 * The attributes to update in the attribute value.
 * @property {string} id - The ID of the attribute value.
 * @property {string} value - The value of the attribute value.
 * @property {number} rank - The rank of the attribute value.
 * @property {Record<string, unknown>} metadata - Holds custom data in key-value pairs.
 */
export interface UpdateAttributeValueDTO {
  /**
 * *
 * The ID of the attribute value.

 */
  id: string;
  /**
 * *
 * The value of the attribute value

 */
  value?: string;
  /**
 * *
 * The rank of the attribute value

 */
  rank?: number;
  /**
 * *
 * Holds custom data in key-value pairs.

 */
  metadata?: Record<string, unknown> | null;
}

/**
 *
 * @interface
 *
 * The product attribute value to be created.
 * @property {string} attribute_id - The associated attribute's ID.
 * @property {string} product_id - The associated product's ID.
 * @property {string} value - The value of the product attribute value
 */
export type CreateProductAttributeValueDTO = {
  /**
 * *
 * The associated attribute's ID.

 */
  attribute_id: string;
  /**
 * *
 * The associated product's ID.

 */
  product_id: string;
  /**
 * *
 * The value of the product attribute value

 */
  value: string;
};
