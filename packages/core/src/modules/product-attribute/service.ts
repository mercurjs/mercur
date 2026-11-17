import type {
  Context,
  FindConfig,
  ModuleJoinerConfig,
} from "@medusajs/framework/types"
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService,
  toHandle,
} from "@medusajs/framework/utils"
import { AttributeScope, AttributeType } from "@mercurjs/types"

import { joinerConfig } from "./joiner-config"
import {
  ProductAttribute,
  ProductAttributeValue,
  ProductVariantAttributeValue,
} from "./models"

class ProductAttributeModuleService extends MedusaService({
  ProductAttribute,
  ProductAttributeValue,
  ProductVariantAttributeValue,
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
      if (!attribute.handle && !attribute.product_id && attribute.name) {
        attribute.handle = toHandle(attribute.name)
      }

      if (attribute.scope === AttributeScope.VARIANT && attribute.is_variant_axis) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Attribute "${attribute.name}" cannot be both a variant axis and a variant-level attribute.`,
        )
      }

      return attribute
    })

    // @ts-ignore
    const result = await super.createProductAttributes(input, sharedContext)

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

    const guardedIds = updates
      .filter((u) => u.id && (u.type !== undefined || u.scope !== undefined))
      .map((u) => u.id as string)

    if (guardedIds.length) {
      const existing = await this.listProductAttributes(
        { id: guardedIds },
        { select: ["id", "type", "scope"] },
        sharedContext,
      )
      const byId = new Map<string, { type: string; scope: string }>(
        existing.map((a) => [a.id, a]),
      )

      for (const update of updates) {
        const current = update.id ? byId.get(update.id) : undefined
        if (!current) {
          continue
        }
        if (update.type !== undefined && update.type !== current.type) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Cannot change the type of an existing attribute (${update.id}): "${current.type}" -> "${update.type}".`,
          )
        }
        if (update.scope !== undefined && update.scope !== current.scope) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Cannot change the scope of an existing attribute (${update.id}): "${current.scope}" -> "${update.scope}".`,
          )
        }
      }
    }

    // @ts-ignore
    return super.updateProductAttributes(data, sharedContext) as any
  }

  private static readonly VALUE_TYPES = new Set<string>([
    AttributeType.SINGLE_SELECT,
    AttributeType.MULTI_SELECT,
    AttributeType.TOGGLE,
  ])

  private wantsValues(config?: FindConfig<any>): boolean {
    const relations = config?.relations ?? []
    if (relations.some((r) => r === "values" || r.startsWith("values."))) {
      return true
    }
    const select = (config?.select as string[] | undefined) ?? []
    return select.some((s) => s === "values" || s.startsWith("values."))
  }

  private stripValuesFromConfig(
    config?: FindConfig<any>,
  ): FindConfig<any> | undefined {
    if (!config) {
      return config
    }

    const next: FindConfig<any> = { ...config }

    if (Array.isArray(next.relations)) {
      next.relations = next.relations.filter(
        (r) => r !== "values" && !r.startsWith("values."),
      )
    }

    if (Array.isArray(next.select)) {
      next.select = Array.from(
        new Set([
          ...(next.select as string[]).filter(
            (s) => s !== "values" && !s.startsWith("values."),
          ),
          "id",
          "type",
        ]),
      )
    }

    return next
  }

  private deriveValueConfig(config?: FindConfig<any>): FindConfig<any> {
    const relations = (config?.relations ?? [])
      .filter((r) => r.startsWith("values."))
      .map((r) => r.slice("values.".length))
    const selectPaths = ((config?.select as string[] | undefined) ?? [])
      .filter((s) => s.startsWith("values."))
      .map((s) => s.slice("values.".length))

    const valueConfig: FindConfig<any> = {}
    if (relations.length) {
      valueConfig.relations = relations
    }
    if (selectPaths.length) {
      valueConfig.select = Array.from(new Set([...selectPaths, "attribute_id"]))
    }

    return valueConfig
  }

  private async attachValues(
    attributes: any[],
    config?: FindConfig<any>,
    sharedContext?: Context,
  ): Promise<void> {
    const valueAttributes = attributes.filter((a) =>
      ProductAttributeModuleService.VALUE_TYPES.has(a.type),
    )

    for (const attribute of attributes) {
      if (!ProductAttributeModuleService.VALUE_TYPES.has(attribute.type)) {
        attribute.values = []
      }
    }

    if (!valueAttributes.length) {
      return
    }

    const values = await this.listProductAttributeValues(
      { attribute_id: valueAttributes.map((a) => a.id) },
      this.deriveValueConfig(config),
      sharedContext,
    )

    const valuesByAttribute = new Map<string, any[]>()
    for (const value of values) {
      const list = valuesByAttribute.get(value.attribute_id) ?? []
      list.push(value)
      valuesByAttribute.set(value.attribute_id, list)
    }

    for (const attribute of valueAttributes) {
      attribute.values = valuesByAttribute.get(attribute.id) ?? []
    }
  }

  @InjectManager()
  // @ts-ignore
  async listProductAttributes(
    filters?: any,
    config?: FindConfig<any>,
    @MedusaContext() sharedContext?: Context,
  ): Promise<any[]> {
    const wantsValues = this.wantsValues(config)

    // @ts-ignore
    const attributes = await super.listProductAttributes(
      filters,
      this.stripValuesFromConfig(config),
      sharedContext,
    )

    if (wantsValues && attributes.length) {
      await this.attachValues(attributes, config, sharedContext)
    }

    return attributes
  }

  @InjectManager()
  // @ts-ignore
  async listAndCountProductAttributes(
    filters?: any,
    config?: FindConfig<any>,
    @MedusaContext() sharedContext?: Context,
  ): Promise<[any[], number]> {
    const wantsValues = this.wantsValues(config)

    // @ts-ignore
    const [attributes, count] = await super.listAndCountProductAttributes(
      filters,
      this.stripValuesFromConfig(config),
      sharedContext,
    )

    if (wantsValues && attributes.length) {
      await this.attachValues(attributes, config, sharedContext)
    }

    return [attributes, count]
  }

  @InjectTransactionManager()
  // @ts-ignore
  async createProductAttributeValues<T extends any | any[]>(
    data: T,
    sharedContext?: Context,
  ): Promise<T extends any[] ? any[] : any> {
    const values = Array.isArray(data) ? data : [data]

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
