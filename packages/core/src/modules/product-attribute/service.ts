import type { Context, ModuleJoinerConfig } from "@medusajs/framework/types"
import {
  InjectTransactionManager,
  MedusaError,
  MedusaService,
  toHandle,
} from "@medusajs/framework/utils"
import { AttributeType } from "@mercurjs/types"

import { joinerConfig } from "./joiner-config"
import { ProductAttribute, ProductAttributeValue } from "./models"

class ProductAttributeModuleService extends MedusaService({
  ProductAttribute,
  ProductAttributeValue,
}) {
  __joinerConfig(): ModuleJoinerConfig {
    return joinerConfig
  }

  @InjectTransactionManager()
  // @ts-ignore
  async createProductAttributes<T extends any | any[]>(
    data: T,
    sharedContext?: Context,
  ): Promise<T extends any[] ? any[] : any> {
    const input = (Array.isArray(data) ? data : [data]).map((attribute) => {
      // Only global (non product-scoped) attributes get a handle. Product-scoped
      // attributes (`product_id` set) live inline on a single product and never
      // surface in the global catalogue, so they don't need a unique handle.
      if (!attribute.handle && !attribute.product_id && attribute.name) {
        attribute.handle = toHandle(attribute.name)
      }

      return attribute
    })

    // @ts-ignore
    const result = await super.createProductAttributes(input, sharedContext)

    // Toggle attributes are boolean: seed them with `true` / `false` values so
    // callers never have to create the two options manually.
    const created = Array.isArray(result) ? result : [result]
    const toggleValues = created
      .filter((attribute) => attribute.type === AttributeType.TOGGLE)
      .flatMap((attribute) => [
        { attribute_id: attribute.id, name: "true", rank: 0 },
        { attribute_id: attribute.id, name: "false", rank: 1 },
      ])

    if (toggleValues.length) {
      await this.createProductAttributeValues(toggleValues, sharedContext)
    }

    return (Array.isArray(data) ? result : result[0]) as any
  }

  @InjectTransactionManager()
  // @ts-ignore
  async updateProductAttributes<T extends any | any[]>(
    data: T,
    sharedContext?: Context,
  ): Promise<T extends any[] ? any[] : any> {
    const updates = Array.isArray(data) ? data : [data]

    // The `type` of an existing attribute is immutable — changing it would
    // invalidate already-stored values and any mirrored native option. Reject
    // updates that attempt to change it for an attribute whose id we know.
    const idsWithType = updates
      .filter((u) => u.id && u.type !== undefined)
      .map((u) => u.id as string)

    if (idsWithType.length) {
      const existing = await this.listProductAttributes(
        { id: idsWithType },
        { select: ["id", "type"] },
        sharedContext,
      )
      const typeById = new Map<string, string>(
        existing.map((a) => [a.id, a.type]),
      )

      for (const update of updates) {
        if (!update.id || update.type === undefined) {
          continue
        }
        const currentType = typeById.get(update.id)
        if (currentType !== undefined && update.type !== currentType) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Cannot change the type of an existing attribute (${update.id}): "${currentType}" -> "${update.type}".`,
          )
        }
      }
    }

    // @ts-ignore
    return super.updateProductAttributes(data, sharedContext) as any
  }

  // Values only make sense on select attributes (single/multi). For any other
  // type (toggle, unit, text) we never expose the `values` relation, even when
  // a caller populates it — strip it so consumers get a consistent shape.
  private stripNonSelectValues<T extends { type?: string; values?: any }>(
    attribute: T,
  ): T {
    const selectTypes = new Set<string>([
      AttributeType.SINGLE_SELECT,
      AttributeType.MULTI_SELECT,
    ])

    if (
      attribute &&
      attribute.values !== undefined &&
      (!attribute.type || !selectTypes.has(attribute.type))
    ) {
      attribute.values = []
    }

    return attribute
  }

  // @ts-ignore
  async listProductAttributes(
    ...args: Parameters<
      MedusaService<{
        ProductAttribute: typeof ProductAttribute
        ProductAttributeValue: typeof ProductAttributeValue
      }>["listProductAttributes"]
    >
  ): Promise<any> {
    // @ts-ignore
    const result = await super.listProductAttributes(...args)
    return result.map((attribute: any) => this.stripNonSelectValues(attribute))
  }

  // @ts-ignore
  async listAndCountProductAttributes(
    ...args: Parameters<
      MedusaService<{
        ProductAttribute: typeof ProductAttribute
        ProductAttributeValue: typeof ProductAttributeValue
      }>["listAndCountProductAttributes"]
    >
  ): Promise<any> {
    // @ts-ignore
    const [result, count] = await super.listAndCountProductAttributes(...args)
    return [
      result.map((attribute: any) => this.stripNonSelectValues(attribute)),
      count,
    ]
  }

  @InjectTransactionManager()
  // @ts-ignore
  async createProductAttributeValues<T extends any | any[]>(
    data: T,
    sharedContext?: Context,
  ): Promise<T extends any[] ? any[] : any> {
    const values = Array.isArray(data) ? data : [data]

    // A value's handle is only generated when its owning attribute is global
    // (non product-scoped) AND a select type (single/multi). Non-select types
    // (toggle, unit, text) don't expose selectable options, so their values
    // never need a handle. Resolve the relevant attributes once.
    const attributeIds = Array.from(
      new Set(values.map((v) => v.attribute_id).filter(Boolean)),
    )
    const attributes = attributeIds.length
      ? await this.listProductAttributes(
          { id: attributeIds },
          { select: ["id", "product_id", "type"] },
          sharedContext,
        )
      : []
    const attributeById = new Map<string, { product_id?: string; type: string }>(
      attributes.map((a) => [a.id, a]),
    )

    const selectTypes = new Set<string>([
      AttributeType.SINGLE_SELECT,
      AttributeType.MULTI_SELECT,
    ])

    const input = values.map((value) => {
      const attribute = attributeById.get(value.attribute_id)
      const isProductScoped = !!attribute?.product_id
      const isSelectType = !!attribute && selectTypes.has(attribute.type)
      if (!value.handle && !isProductScoped && isSelectType && value.name) {
        value.handle = toHandle(value.name)
      }

      return value
    })

    // @ts-ignore
    const result = await super.createProductAttributeValues(
      input,
      sharedContext,
    )
    return (Array.isArray(data) ? result : result[0]) as any
  }
}

export default ProductAttributeModuleService
