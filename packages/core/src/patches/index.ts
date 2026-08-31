import { cartRefreshFieldsPatch } from "./patches/cart-refresh-fields"
import { refreshCartShippingMethodsPatch } from "./patches/refresh-cart-shipping-methods"
import { readPackageVersion, resolvePackageDirs } from "./resolve-package-dirs"
import type { MercurPatch, PatchTarget } from "./types"
import { isWithinRange } from "./version"

// Mercur has to correct a handful of Medusa internals that expose no hook. A
// published patch file would be the obvious way to do that, but patches are
// applied by the package manager, and `templates/basic` supports four of them
// with four incompatible mechanisms — and none of them reach a marketplace
// that installed `@mercurjs/core` into an existing Medusa app. So the patches
// ship as code and are applied from `withMercur()`, which every project calls.
//
// The lifecycle mirrors Expo's `patch-project`: bind each patch to the exact
// baseline it was written against, probe before applying, and refuse loudly
// rather than degrade to a silent no-op.

export const MERCUR_PATCHES: MercurPatch[] = [
  cartRefreshFieldsPatch,
  refreshCartShippingMethodsPatch,
]

export type ApplyPatchesOptions = {
  /** Patch ids to skip, for adopters who need to opt out of one. */
  disabled?: string[]
  logger?: Pick<Console, "info" | "warn">
}

function describe(patch: MercurPatch, target: PatchTarget): string {
  const where = target.dir ? ` at ${target.dir}` : ""
  return `${patch.package}@${target.version ?? "unknown"}${where}`
}

function targetsFor(patch: MercurPatch): PatchTarget[] {
  if (patch.scope === "registry") {
    const [dir] = resolvePackageDirs(patch.package)
    return [{ dir: null, version: dir ? readPackageVersion(dir) : null }]
  }

  return resolvePackageDirs(patch.package).map((dir) => ({
    dir,
    version: readPackageVersion(dir),
  }))
}

function applyPatch(
  patch: MercurPatch,
  target: PatchTarget,
  logger: NonNullable<ApplyPatchesOptions["logger"]>
): void {
  if (target.version && !isWithinRange(target.version, patch.compatible)) {
    throw new Error(
      `[mercur] Patch "${patch.id}" was written against ${patch.package} ` +
        `>=${patch.compatible.from} <${patch.compatible.to}, but ${describe(
          patch,
          target
        )} is installed. Re-verify the patch against that version, or skip it ` +
        `via projectConfig.mercur.disabledPatches — note that skipping restores ` +
        `the upstream bug this patch fixes:\n  ${patch.reason}`
    )
  }

  if (patch.isApplied(target)) {
    return
  }

  if (!patch.detect(target)) {
    throw new Error(
      `[mercur] Patch "${patch.id}" no longer recognises ${describe(
        patch,
        target
      )}. The code it targets has moved or changed shape, so the patch cannot ` +
        `be applied safely. Update the patch for this version.`
    )
  }

  patch.apply(target)

  if (!patch.isApplied(target)) {
    throw new Error(
      `[mercur] Patch "${patch.id}" ran against ${describe(patch, target)} but ` +
        `did not take effect.`
    )
  }

  logger.info(`[mercur] Applied patch "${patch.id}" to ${describe(patch, target)}`)
}

export function applyMercurPatches(options: ApplyPatchesOptions = {}): void {
  const disabled = new Set(options.disabled ?? [])
  const logger = options.logger ?? console

  for (const patch of MERCUR_PATCHES) {
    if (disabled.has(patch.id)) {
      logger.warn(
        `[mercur] Skipping patch "${patch.id}" (disabled). This restores the ` +
          `upstream behaviour it corrects:\n  ${patch.reason}`
      )
      continue
    }

    const targets = targetsFor(patch)

    if (!targets.length) {
      throw new Error(
        `[mercur] Patch "${patch.id}" found no installed copy of ${patch.package}.`
      )
    }

    for (const target of targets) {
      applyPatch(patch, target, logger)
    }
  }
}
