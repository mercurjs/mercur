import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { CreateAttributeValueDTO } from '../../../modules/attribute/types'
import { createAttributePossibleValuesStep } from '../steps/create-attribute-possible-values'

const createAttributePossibleValuesWorkflowId =
  'create-attribute-possible-values'

export type CreateAttributePossibleValuesWorkflowInput =
  CreateAttributeValueDTO[]

export const createAttributePossibleValuesWorkflow = createWorkflow(
  createAttributePossibleValuesWorkflowId,
  (input: CreateAttributePossibleValuesWorkflowInput) => {
    const createdValues = createAttributePossibleValuesStep(input)

    return new WorkflowResponse(createdValues)
  }
)
