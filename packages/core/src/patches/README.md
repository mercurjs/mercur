# patches

Corrections to Medusa internals that expose no hook.

A published patch file would be the obvious way to ship these, but patches are
applied by the package manager, and `templates/basic` supports four of them with
four incompatible mechanisms (bun `patchedDependencies`, yarn's `patch:`
protocol, pnpm `patchedDependencies`, and npm — which has none). None of those
reach a marketplace that installed `@mercurjs/core` into an existing Medusa app.

So the patches ship as code and are applied from `withMercur()`, which every
project calls in `medusa-config.ts`. They travel with the package version and
arrive on a normal `@mercurjs/core` upgrade.

The lifecycle is modelled on Expo's `patch-project`, which solves the same
problem for regenerated native projects:

| `patch-project`                       | here                                  |
| ------------------------------------- | ------------------------------------- |
| patch filename keyed by templateChecksum | `compatible` version range          |
| `git apply --reverse --check`         | `isApplied()`                         |
| `git apply` fails loudly              | `detect()` + post-apply re-probe      |
| changed-lines warning                 | boot log per applied patch            |

## Adding a patch

Implement `MercurPatch` in `patches/` and add it to `MERCUR_PATCHES`.

- `compatible` — the versions the body was *verified* against, not the ones it
  probably works on. Out-of-range refuses to boot.
- `detect` — assert the baseline is shaped as expected. Never degrade to a
  silent no-op; a patch that stops applying must say so.
- `isApplied` — config can be loaded more than once per process.
- `scope` — `registry` patches act on the process-global workflow registry and
  run once. `module` patches mutate a package's loaded exports and run against
  every physical copy found on disk.

## Escape hatch

```ts
withMercur({
  projectConfig: { mercur: { disabledPatches: ["core-flows/cart-refresh-fields"] } },
})
```

Skipping a patch restores the upstream bug it corrects; the reason is logged.

## Current patches

- **`core-flows/cart-refresh-fields`** — adds `items.offer.shipping_profile_id`
  to `cartFieldsForRefreshSteps`, so the cart handed to the shipping-method
  refresh carries the offer each line was bought through.
- **`core-flows/refresh-cart-shipping-methods`** — derives the refresh's
  required shipping profiles from the offer rather than the master product.
  Upstream reads `item.variant.product.shipping_profile.id`, but the product
  link is one-to-one and the first offerer wins it, so in a multi-seller cart
  every other seller's method was deleted as an orphan and checkout failed.
  See https://github.com/mercurjs/mercur/issues/1442.

Both are removable once the equivalent fix lands upstream in Medusa.
