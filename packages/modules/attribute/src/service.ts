import { EntityManager } from "@mikro-orm/knex";
import { UpdateAttributeDTO } from "@mercurjs/framework";
import { Context, DAL, InferTypeOf } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils";

import Attribute from "./models/attribute";
import AttributePossibleValue from "./models/attribute-possible-value";
import AttributeValue from "./models/attribute-value";

type Attribute = InferTypeOf<typeof Attribute>;
type AttributePossibleValue = InferTypeOf<typeof AttributePossibleValue>;

type InjectedDependencies = {
  attributeRepository: DAL.RepositoryService<Attribute>;
  attributePossibleValueRepository: DAL.RepositoryService<AttributePossibleValue>;
};

class AttributeModuleService extends MedusaService({
  Attribute,
  AttributeValue,
  AttributePossibleValue,
}) {
  protected attributeRepository_: DAL.RepositoryService<Attribute>;
  protected attributePossibleValueRepository_: DAL.RepositoryService<AttributePossibleValue>;

  constructor({
    attributeRepository,
    attributePossibleValueRepository,
  }: InjectedDependencies) {
    super(...arguments);
    this.attributeRepository_ = attributeRepository;
    this.attributePossibleValueRepository_ = attributePossibleValueRepository;
  }

  /**
   *
   * @param input
   * @param sharedContext
   *
   * Useful to update attribute, allowing to upsert possible_values in the same operation. If "id"
   * is not provided for "possible_values" entries, it will lookup the DB by attributePossibleValue.value,
   * to update or create accordingly.
   *
   * Assumes caller will eventually refetch entities, for now, to reduce complexity of this
   * method and concentrate on upserting like ProductOption - ProductOptionValue from Medusa
   */
  @InjectManager()
  async updateAttributeWithUpsertOrReplacePossibleValues(
    input: UpdateAttributeDTO | UpdateAttributeDTO[],
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const normalizedInput = Array.isArray(input) ? input : [input];

    return this.updateAttributeWithUpsertOrReplacePossibleValues_(
      normalizedInput,
      sharedContext
    );
  }

  @InjectTransactionManager()
  protected async updateAttributeWithUpsertOrReplacePossibleValues_(
    input: UpdateAttributeDTO[],
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const upsertedValues = await this.attributePossibleValueRepository_.upsert(
      input.flatMap((element) => element.possible_values),
      sharedContext
    );

    const attributesInput = input.map((toUpdate) => {
      const { ...attribute } = toUpdate;
      return {
        ...attribute,
        possible_values: upsertedValues
          .filter((val) => val.attribute_id === attribute.id)
          .map((upserted) => ({ id: upserted.id })),
      };
    });

    return this.attributeRepository_.upsertWithReplace(
      attributesInput,
      { relations: ["possible_values"] },
      sharedContext
    );
  }
}

export default AttributeModuleService;
