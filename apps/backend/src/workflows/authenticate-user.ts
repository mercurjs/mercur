import { MedusaRequest } from '@medusajs/framework/http'
import { MedusaError, Modules } from '@medusajs/framework/utils'
import {
  StepResponse,
  WorkflowResponse,
  createStep,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

type WorkflowInput = {
  req: MedusaRequest
}

const authenticateUserStep = createStep(
  'authenticate-user',
  async ({ req }: any, { container }) => {
    const authModuleService = container.resolve(Modules.AUTH)

    const { success, location } = await authModuleService.authenticate(
      'my-auth', // auth provider name
      // passed to auth provider
      {
        // ...
      }
    )

    if (location) {
      console.log(location)

      return new StepResponse(location)

      // return the location for the front-end to redirect to
    }

    if (!success) {
      // authentication failed
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        'Incorrect authentication details'
      )
    }

    // const { success, authIdentity, error } =
    //   await authModuleService.validateCallback("my-auth", {
    //     url: req.url,
    //     headers: req.headers,
    //     query: req.query,
    //     body: req.body,
    //     protocol: req.protocol,
    //     authScope: "admin", // or custom actor type
    //   } as AuthenticationInput);

    // return new StepResponse({ authIdentity }, authIdentity?.id);
  }
  //   async (authIdentityId, { container }) => {
  //     if (!authIdentityId) {
  //       return;
  //     }

  //     const authModuleService = container.resolve(Modules.AUTH);

  //     await authModuleService.deleteAuthIdentities([authIdentityId]);
  //   }
)

export const authenticateUser: any = createWorkflow(
  'authenticate-user',
  (input: WorkflowInput) => {
    const location = authenticateUserStep(input)

    return new WorkflowResponse({
      location
    })
  }
)
