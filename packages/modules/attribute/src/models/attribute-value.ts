import { model } from "@medusajs/framework/utils";

import Attribute from "./attribute";

/**
 * @class AttributeValue
 * @description Represents a possible value for an attribute in the system.
 *
 * Represents a specific value for an attribute in the system. This model is used to store
 * individual values that can be associated with products, categories, or other entities
 * through the Attribute model. Each attribute can have multiple values, and each value
 * can be ranked for ordering purposes.
 *
 * @example
 * // Example attribute values:
 * // - Attribute: "Color" -> Values: ["Red", "Blue", "Green"]
 * // - Attribute: "Size" -> Values: ["Small", "Medium", "Large"]
 * // - Attribute: "Material" -> Values: ["Cotton", "Polyester", "Wool"]
 */
const AttributeValue = model.define("attribute_value", {
  /**
   * Unique identifier for the attribute value
   * Auto-generated with prefix 'attr_val'
   */
  id: model.id({ prefix: "attr_val" }).primaryKey(),

  /**
   * The actual value string for this attribute
   * @example "Red", "Large", "Cotton"
   */
  value: model.text(),

  /**
   * Numeric rank for ordering attribute values
   * Used to determine the display order of values within an attribute
   * @example 1, 2, 3
   */
  rank: model.number(),

  /**
   * Additional metadata stored as JSON
   * Can contain extra information about the attribute value
   * @example { "hex_color": "#FF0000", "description": "Bright red color" }
   */
  metadata: model.json().nullable(),

  /**
   * Reference to the parent Attribute model
   * Establishes a many-to-one relationship where multiple values belong to one attribute
   * The 'mappedBy' property indicates that the Attribute model has a 'values' property
   * that contains the collection of AttributeValue instances
   */
  attribute: model.belongsTo(() => Attribute, {
    mappedBy: "values",
  }),
});

export default AttributeValue;
