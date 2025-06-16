import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { ATTRIBUTE_MODULE } from "../../../modules/attribute";
import AttributeModuleService from "../../../modules/attribute/service";
import { CreateProductAttributeValueDTO } from "../../../modules/attribute/types"

export const createAttributeValueStepId = 'create-attribute-value'

export const createAttributeValueStep = createStep(
    createAttributeValueStepId,
    async (input: Omit<CreateProductAttributeValueDTO, 'product_id'>, { container }) => {
        const attributeModuleService = container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE)
        
        const created = await attributeModuleService.createAttributeValues(input)

        return new StepResponse(created, created.id)
    },
    async (id: string | undefined, { container }) => {
        if (!id) {
            return;
        }
        
        const attributeModuleService = container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE)
        await attributeModuleService.deleteAttributeValues(id)
    }
)