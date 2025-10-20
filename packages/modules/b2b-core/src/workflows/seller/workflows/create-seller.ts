import { transform } from "@medusajs/framework/workflows-sdk";
import { setAuthAppMetadataStep } from "@medusajs/medusa/core-flows";
import {
  WorkflowResponse,
  createHook,
  createWorkflow,
} from "@medusajs/workflows-sdk";

import { CreateMemberDTO, CreateSellerDTO } from "@mercurjs/framework";

import {
  createMemberStep,
  createSellerOnboardingStep,
  createSellerStep,
  createSellerShippingProfileStep,
} from "../steps";

type CreateSellerWorkflowInput = {
  seller: CreateSellerDTO;
  member: Omit<CreateMemberDTO, "seller_id">;
  auth_identity_id: string;
};

export const createSellerWorkflow = createWorkflow(
  "create-seller",
  function (input: CreateSellerWorkflowInput) {
    const seller = createSellerStep(input.seller);

    const memberInput = transform(
      { seller, member: input.member },
      ({ member, seller }) => ({
        ...member,
        seller_id: seller.id,
      })
    );

    const member = createMemberStep(memberInput);
    createSellerOnboardingStep(seller);

    setAuthAppMetadataStep({
      authIdentityId: input.auth_identity_id,
      actorType: "seller",
      value: member.id,
    });

    createSellerShippingProfileStep(seller);
    const sellerCreatedHook = createHook("sellerCreated", {
      sellerId: seller.id,
    });
    return new WorkflowResponse(seller, { hooks: [sellerCreatedHook] });
  }
);
