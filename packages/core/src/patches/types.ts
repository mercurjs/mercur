export type PatchScope = "module" | "registry"

export type PatchTarget = {
  /**
   * The resolved package root, or `null` for registry-scoped patches which act
   * on a process-global singleton rather than a copy on disk.
   */
  dir: string | null
  version: string | null
}

export interface MercurPatch {
  id: string
  /** npm package the patch is authored against. */
  package: string
  /**
   * Versions this patch body was verified against, inclusive lower bound and
   * exclusive upper bound. Binds a patch to the baseline it was written for so
   * an upstream bump fails loudly instead of applying to a changed body.
   */
  compatible: { from: string; to: string }
  /**
   * `module` patches mutate a package's loaded exports and must run against
   * every physical copy. `registry` patches act on a process-global (the
   * workflow registry), so they run exactly once.
   */
  scope: PatchScope
  /** Human-readable reason, surfaced in boot logs and errors. */
  reason: string
  /** Is the baseline shaped the way this patch expects? */
  detect(target: PatchTarget): boolean
  /** Already applied? Re-entrant boots and repeated config loads must be safe. */
  isApplied(target: PatchTarget): boolean
  apply(target: PatchTarget): void
}
