import { assertPatchesDisabled, disabledPatchesFromEnv } from "../index"

const APPLIED = Symbol.for("@mercurjs/core/patches-applied")
const state = globalThis as typeof globalThis & {
  [APPLIED]?: { disabled: string[] }
}

describe("disabledPatchesFromEnv", () => {
  it("reads a comma separated list", () => {
    expect(
      disabledPatchesFromEnv({ MERCUR_DISABLED_PATCHES: " a.patch, ,b.patch " })
    ).toEqual(["a.patch", "b.patch"])
  })

  it("is empty when unset", () => {
    expect(disabledPatchesFromEnv({})).toEqual([])
  })
})

describe("assertPatchesDisabled", () => {
  afterEach(() => {
    delete state[APPLIED]
  })

  it("accepts a config opt-out that was already honoured on import", () => {
    state[APPLIED] = { disabled: ["a.patch"] }

    expect(() => assertPatchesDisabled(["a.patch"])).not.toThrow()
  })

  it("fails when the config opts out of a patch that was applied on import", () => {
    state[APPLIED] = { disabled: [] }

    expect(() => assertPatchesDisabled(["a.patch"])).toThrow(
      /MERCUR_DISABLED_PATCHES="a.patch"/
    )
  })
})
