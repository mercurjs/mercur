import { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import { Context, DAL, InferTypeOf } from "@medusajs/framework/types"
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils"

import { UpdateAttributeDTO } from "@mercurjs/types"
import Attribute from "./models/attribute"
import AttributePossibleValue from "./models/attribute-possible-value"
import AttributeValue from "./models/attribute-value"

type IAttribute = InferTypeOf<typeof Attribute>
type IAttributePossibleValue = InferTypeOf<typeof AttributePossibleValue>

type InjectedDependencies = {
  attributeRepository: DAL.RepositoryService<IAttribute>
  attributePossibleValueRepository: DAL.RepositoryService<IAttributePossibleValue>
}

class AttributeModuleService extends MedusaService({
  Attribute,
  AttributeValue,
  AttributePossibleValue,
}) {
  protected attributeRepository_: DAL.RepositoryService<IAttribute>
  protected attributePossibleValueRepository_: DAL.RepositoryService<IAttributePossibleValue>

  constructor({
    attributeRepository,
    attributePossibleValueRepository,
  }: InjectedDependencies) {
    super(...arguments)
    this.attributeRepository_ = attributeRepository
    this.attributePossibleValueRepository_ =
      attributePossibleValueRepository
  }

  @InjectManager()
  async updateAttributeWithUpsertOrReplacePossibleValues(
    input: UpdateAttributeDTO | UpdateAttributeDTO[],
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const normalizedInput = Array.isArray(input) ? input : [input]

    return this.updateAttributeWithUpsertOrReplacePossibleValues_(
      normalizedInput,
      sharedContext
    )
  }

  @InjectTransactionManager()
  protected async updateAttributeWithUpsertOrReplacePossibleValues_(
    input: UpdateAttributeDTO[],
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const inputsWithValues = input.filter(
      (element) => element.possible_values !== undefined
    )

    const allPossibleValues = inputsWithValues.flatMap(
      (element) => element.possible_values!
    )

    const upsertedValues = allPossibleValues.length
      ? await this.attributePossibleValueRepository_.upsert(
          allPossibleValues,
          sharedContext
        )
      : []

    const attributesInput = input.map((toUpdate) => {
      const { possible_values, ...rest } = toUpdate

      if (possible_values === undefined) {
        return rest
      }

      return {
        ...rest,
        possible_values: upsertedValues
          .filter((val) => val.attribute_id === rest.id)
          .map((upserted) => ({ id: upserted.id })),
      }
    })

    const hasRelationUpdates = inputsWithValues.length > 0

    return this.attributeRepository_.upsertWithReplace(
      attributesInput,
      { relations: hasRelationUpdates ? ["possible_values"] : [] },
      sharedContext
    )
  }
}

export default AttributeModuleService
