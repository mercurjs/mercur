export interface PatchEntry {
  /** Patch file under `patches/`, named `<package>@<generated-from-version>.patch`. */
  file: string
  package: string
  /**
   * Versions the patch is allowed to be attempted against. Applying is still
   * gated on the diff's own context matching — this range only produces a
   * clearer error than a failed hunk when a bump is known to be incompatible.
   */
  compatible: { from: string; to: string }
  /** Surfaced in boot logs and in the error raised when the patch stops applying. */
  reason: string
}

export const PATCHES: PatchEntry[] = [
  {
    file: "@medusajs+core-flows@2.18.0.patch",
    package: "@medusajs/core-flows",
    // Both targeted files are byte-identical in 2.17.2 and 2.18.0.
    compatible: { from: "2.17.0", to: "2.19.0" },
    reason:
      "refreshCartShippingMethodsWorkflow deletes any shipping method whose " +
      "profile is not required by a cart item, deriving that set from each " +
      "item's master product. In Mercur the profile belongs to the offer — the " +
      "product link is one-to-one and the first offerer wins it — so in a " +
      "multi-seller cart holding a co-sold product every other seller's method " +
      "is judged orphaned and checkout fails. The patch disables that cleanup. " +
      "See mercurjs/mercur#1442.",
  },
]
