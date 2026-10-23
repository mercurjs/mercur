import { PayoutKycStatus } from "@mercurjs/types"

import { deriveKycStatus } from "../kyc"

const req = (overrides: Partial<{ currently_due: string[]; past_due: string[]; pending_verification: string[] }> = {}) => ({
  currently_due: [],
  past_due: [],
  pending_verification: [],
  ...overrides,
})

describe("deriveKycStatus", () => {
  it("checks requirements before the disabled reason", () => {
    expect(deriveKycStatus(req({ currently_due: ["individual.id_number"] }), null)).toBe(PayoutKycStatus.PENDING_SUBMISSION)
    expect(deriveKycStatus(req({ pending_verification: ["individual.verification.document"] }), null)).toBe(PayoutKycStatus.PENDING_APPROVAL)
    expect(deriveKycStatus(req(), "rejected.fraud")).toBe(PayoutKycStatus.REFUSED)
    expect(deriveKycStatus(req(), "under_review")).toBe(PayoutKycStatus.PENDING_APPROVAL)
    expect(deriveKycStatus(req(), null)).toBe(PayoutKycStatus.APPROVED)
  })
})
