/**
 * @enum Attribute UI components
 */
export enum AttributeUIComponent {
  /**
   * Select component for single value selection
   * @defaultValue "select"
   */
  SELECT = "select",
  /**
   * Multi-value component for multiple value selection
   * @defaultValue "multivalue"
   */
  MULTIVALUE = "multivalue",
  /**
   * Unit component for unit-based values
   * @defaultValue "unit"
   */
  UNIT = "unit",
  /**
   * Toggle component for boolean values
   * @defaultValue "toggle"
   */
  TOGGLE = "toggle",
  /**
   * Text area component for long text input
   * @defaultValue "text_area"
   */
  TEXTAREA = "text_area",
  /**
   * Color picker component for color selection
   * @defaultValue "color_picker"
   */
  COLOR_PICKER = "color_picker",
}

/**
 * @interface
 * The product attribute value details.
 * @property {string} value - The value of the product attribute value
 * @property {string} attribute_id - The associated attribute's ID.
 */
export interface ProductAttributeValueDTO {
  /**
   * The value of the product attribute value
   */
  value: string;
  /**
   * The associated attribute's ID.
   */
  attribute_id: string;
}

/**
 * @interface
 * The attribute possible value details.
 * @property {string} id - The ID of the attribute possible value.
 * @property {string} value - The value of the attribute possible value
 * @property {number} rank - The rank of the attribute possible value
 * @property {string} created_at - The created at of the attribute possible value
 * @property {Record<string, unknown>} metadata - Holds custom data in key-value pairs.
 */
export interface AttributePossibleValueDTO {
  /**
   * The ID of the attribute possible value.
   */
  id: string;
  /**
   * The value of the attribute possible value
   */
  value: string;
  /**
   * The rank of the attribute possible value
   */
  rank: number;
  /**
   * The created at of the attribute possible value
   */
  created_at: string;
  /**
   * Holds custom data in key-value pairs.
   */
  metadata?: Record<string, unknown>;
}

/**
 * @interface
 * The attribute details.
 * @property {string} id - The ID of the attribute.
 * @property {string} name - The name of the attribute
 * @property {string} description - The description of the attribute
 * @property {string} handle - The handle of the attribute
 * @property {boolean} is_filterable - Whether the attribute is filterable.
 * @property {AttributeUIComponent} ui_component - The ui component of the attribute
 */
export interface AttributeDTO {
  /**
   * The ID of the attribute.
   */
  id: string;
  /**
   * The name of the attribute
   */
  name: string;
  /**
   * The description of the attribute
   */
  description: string;
  /**
   * The handle of the attribute
   */
  handle: string;
  /**
   * Whether the attribute is filterable.
   */
  is_filterable: boolean;
  /**
   * The ui component of the attribute
   */
  ui_component: AttributeUIComponent;
  /**
   * Holds custom data in key-value pairs.
   */
  metadata?: Record<string, unknown>;
  /**
   * The possible values of the attribute
   */
  possible_values?: AttributePossibleValueDTO[];
  /**
   * The values of the attribute
   */
  values?: Array<{
    /**
     * The ID of the entity.
     */
    id: string;
    /**
     * The value of the attribute
     */
    value: string;
  }>;
  /**
   * The product categories of the attribute
   */
  product_categories?: Array<{
    /**
     * The ID of the entity.
     */
    id: string;
    /**
     * The name of the product category
     */
    name: string;
  }>;
}
