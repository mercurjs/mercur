import { model } from "@medusajs/framework/utils";

import Attribute from "./attribute";

/**
 * @class AttributePossibleValue
 * @description Represents a possible value for an attribute in the system.
 *
 * This model defines the structure for storing possible values that can be assigned
 * to attributes. Each possible value is associated with a specific attribute and
 * can be ranked for ordering purposes. This is commonly used for product attributes
 * like size, color, material, etc., where predefined values need to be maintained.
 *
 */
const AttributePossibleValue = model
  .define("attribute_possible_value", {
    /**
     * @property {string} id - Unique identifier for the attribute possible value
     * @description Auto-generated primary key with prefix 'attr_pos_val'
     * @example "attr_pos_val_01H9X8Y7Z6W5V4U3T2S1R0Q"
     */
    id: model.id({ prefix: "attr_pos_val" }).primaryKey(),

    /**
     * @property {string} value - The actual value text for this possible value
     * @description The human-readable value that represents this option
     * @example "Large", "Red", "Cotton", "Premium"
     * @required
     */
    value: model.text(),

    /**
     * @property {number} rank - The ordering rank of this possible value
     * @description Used to determine the display order of possible values
     * @example 1, 2, 3 (lower numbers appear first)
     * @default 0
     */
    rank: model.number(),

    /**
     * @property {Object|null} metadata - Additional custom data for this possible value
     * @description Flexible JSON field for storing additional information
     * @example { hexColor: "#FF0000", materialCode: "COT001", isActive: true }
     * @nullable
     */
    metadata: model.json().nullable(),

    /**
     * @property {Attribute} attribute - The parent attribute this value belongs to
     * @description Belongs to relationship with the Attribute model
     * @example Size attribute containing values: "Small", "Medium", "Large"
     * @required
     */
    attribute: model.belongsTo(() => Attribute, {
      mappedBy: "possible_values",
    }),
  })
  .indexes([
    /**
     * @index UQ_attribute_id_value
     * @description Unique composite index ensuring no duplicate values per attribute
     * @columns ['attribute_id', 'value']
     * @unique true
     */
    {
      on: ["attribute_id", "value"],
      name: "UQ_attribute_id_value",
      unique: true,
    },
  ]);

export default AttributePossibleValue;
