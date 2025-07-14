import { model } from "@medusajs/framework/utils";

import { AttributeUIComponent } from "@mercurjs/framework";
import AttributePossibleValue from "./attribute-possible-value";
import AttributeValue from "./attribute-value";

/**
 * @class Attribute
 * @description Represents a product attribute in the marketplace system.
 *
 * This model defines the structure for storing product attributes that can be used
 * to categorize, filter, and describe products. Attributes are flexible entities
 * that can represent various product characteristics such as size, color, material,
 * brand, or any custom property. Each attribute can have multiple possible values
 * and can be associated with specific product categories.
 *
 * Attributes support different UI components for data entry and display, making
 * them adaptable to various use cases from simple text inputs to complex selectors.
 *
 * @example
 * // Common attribute examples:
 * // - Color: with values ["Red", "Blue", "Green", "Black"]
 * // - Size: with values ["XS", "S", "M", "L", "XL"]
 * // - Material: with values ["Cotton", "Polyester", "Wool"]
 * // - Brand: with values ["Nike", "Adidas", "Puma"]

 */
const Attribute = model
  .define("attribute", {
    /**
     * @property {string} id - Unique identifier for the attribute
     * @description Auto-generated primary key with prefix 'attr'
     * @example "attr_01H9X8Y7Z6W5V4U3T2S1R0Q"
     * @required
     */
    id: model.id({ prefix: "attr" }).primaryKey(),

    /**
     * @property {string} name - Human-readable name of the attribute
     * @description The display name used in user interfaces and product listings
     * @example "Color", "Size", "Material", "Brand"
     * @required
     * @searchable
     */
    name: model.text().searchable(),

    /**
     * @property {string|null} description - Detailed description of the attribute
     * @description Optional description providing additional context about the attribute's purpose
     * @example "Product color options available for this item"
     * @nullable
     */
    description: model.text().nullable(),

    /**
     * @property {boolean} is_filterable - Whether the attribute can be used for filtering
     * @description Controls whether this attribute appears in product filter options
     * @default true
     * @example true - Color can be used to filter products
     * @example false - Internal SKU should not appear in filters
     */
    is_filterable: model.boolean().default(true),

    /**
     * @property {string} handle - Unique URL-friendly identifier
     * @description Used in URLs and API endpoints, must be unique across all attributes
     * @example "color", "size", "material"
     * @required
     * @unique
     */
    handle: model.text().unique(),

    /**
     * @property {Object|null} metadata - Additional custom data for the attribute
     * @description Flexible JSON field for storing additional information specific to the attribute
     * @example {
     *   "display_order": 1,
     *   "is_required": true,
     *   "validation_rules": ["required", "max_length:50"]
     * }
     * @nullable
     */
    metadata: model.json().nullable(),

    /**
     * @property {AttributeUIComponent} ui_component - UI component type for data entry
     * @description Determines the type of input component used when editing this attribute
     * @default AttributeUIComponent.SELECT
     * @enum {AttributeUIComponent}
     * @example AttributeUIComponent.SELECT - Dropdown selection
     * @example AttributeUIComponent.TOGGLE - Boolean toggle switch
     * @example AttributeUIComponent.COLOR_PICKER - Color picker component
     */
    ui_component: model
      .enum(Object.values(AttributeUIComponent))
      .default(AttributeUIComponent.SELECT),

    /**
     * @property {AttributeValue[]} values - Collection of actual attribute values
     * @description One-to-many relationship with AttributeValue entities
     * @relationship hasMany
     * @cascade delete
     * @example [
     *   { id: "attr_val_1", value: "Red", rank: 1 },
     *   { id: "attr_val_2", value: "Blue", rank: 2 }
     * ]
     */
    values: model.hasMany(() => AttributeValue),

    /**
     * @property {AttributePossibleValue[]} possible_values - Collection of predefined possible values
     * @description One-to-many relationship with AttributePossibleValue entities
     * @relationship hasMany
     * @cascade delete
     * @example [
     *   { id: "attr_pos_val_1", value: "Red", rank: 1 },
     *   { id: "attr_pos_val_2", value: "Blue", rank: 2 }
     * ]
     */
    possible_values: model.hasMany(() => AttributePossibleValue),
  })
  .cascades({
    /**
     * @cascade delete
     * @description When an attribute is deleted, all related values and possible values are also deleted
     * @targets ["values", "possible_values"]
     */
    delete: ["values", "possible_values"],
  });

export default Attribute;
