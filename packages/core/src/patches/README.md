# patches

Unified diffs against Medusa internals that expose no hook, applied at boot.

Shipping these through a package manager is not an option: `templates/basic`
supports bun, yarn, pnpm and npm, whose patch mechanisms are mutually
incompatible (`patchedDependencies` / the `patch:` protocol / `patchedDependencies`
/ nothing native), and none of them reach a marketplace that installed
`@mercurjs/core` into an existing Medusa app.

So the diffs live here and are applied from `withMercur()`, which every project
calls in `medusa-config.ts`. They travel with the package version and arrive on a
normal `@mercurjs/core` upgrade.

## How they are applied

**In memory, never to disk.** A server boot has no business mutating installed
packages, and workers would race each other doing it. `loader.ts` installs a
`.js` loader hook and compiles the patched source in place of the original on
first require.

`withMercur()` is not always the first thing to pull in a target package —
`@medusajs/test-utils` requires `@medusajs/core-flows` before it loads
`medusa-config` — so a patched file may already sit in the require cache with its
unpatched source. Those files (only those files, never the whole package) are
evicted and required again through the hook. A workflow module re-registers
itself under the same id on that second load, and since the reload replays the
same source, replacing the previous definition is the correct outcome: Medusa's
duplicate guard is relaxed for the duration of the reload, because generated step
ids make a second load of the same file compare unequal to the first.

That covers Node's module loader. Jest has its own: it loads modules through its
own registry and never consults `Module._extensions`, so neither the override nor
the eviction above can fire under test. Left at that, the patches are silently
inert in every suite while the runtime still reports them applied — tests would
exercise different code than production, which is worse than not patching at all.

`jest-transformer.ts` closes that gap by applying the same diff at transform
time. Register it ahead of the project transform and let the targeted files
through `transformIgnorePatterns` (see `integration-tests/jest.config.js`):

```js
transform: {
  "node_modules[\\/].*core-flows[\\/]dist[\\/]cart[\\/].*\\.js$":
    "@mercurjs/core/patches/jest-transformer",
  "^.+\\.[jt]s$": ["@swc/jest", { /* ... */ }],
},
transformIgnorePatterns: ["/node_modules/(?!.*core-flows[\\/]dist[\\/]cart[\\/])"],
```

Both paths funnel through `patchSourceForPath`, so a patch means the same thing
in either environment, and `jest-transformer.unit.spec.ts` fails if the test
environment ever stops seeing patched sources. **Any other runner with its own
module registry — vitest, some bundlers — needs the same treatment, or the
patches will not apply there.**

Because nothing is written, a patch that a user *also* applied through their own
package manager is detected and skipped rather than treated as a conflict.

## Lifecycle

- **already applied** — every hunk reverses cleanly, so the patch is skipped.
  Someone may have applied the same diff through their own package manager.
- **stale** — a hunk no longer matches its context: boot fails, naming the patch
  and the bug that skipping it would restore.
- **out of range** — the copy this project resolves is outside the patch's
  `compatible` range: boot fails with the installed version. Incidental copies in
  a shared package-manager store are skipped rather than fatal.
- **applied** — one log line per patch, with the number of copies touched.

The diff's own context is the real guard: if upstream moves the code, the hunk
stops matching and boot fails with the patch name and the bug it corrects. The
`compatible` range in `manifest.ts` only turns a known-incompatible bump into a
clearer message than a failed hunk.

## Adding a patch

1. Copy the target package's file out of `node_modules`, edit it, and
   `git diff --no-index` the pair. Paths in the patch are relative to the package
   root (`dist/...`).
2. Name the file `<package>@<version-generated-from>.patch`, with `/` in the
   package name written as `+`.
3. Add an entry to `PATCHES` in `manifest.ts`.
4. Mark each hunk with a `// MERCUR:` comment saying *why*. Someone reading the
   patched file in `node_modules` while debugging needs that.

`bun run test:unit` covers every patch in the manifest: that it still applies to
each in-range copy, that it reverses cleanly, and that a drifted context is
refused rather than relocated. That suite is the drift gate — run it on every
Medusa bump.

Keep patches small. A large one means the change belongs in a Mercur workflow or
upstream in Medusa, not here.

## Escape hatch

```ts
withMercur({
  projectConfig: {
    mercur: { disabledPatches: ["@medusajs+core-flows@2.17.2.patch"] },
  },
})
```

Skipping a patch restores the upstream bug it corrects; the reason is logged.

## Current patches

- **`@medusajs+core-flows@2.18.0.patch`** — disables the orphan-profile cleanup in
  `refreshCartShippingMethodsWorkflow`. Upstream deletes a shipping method whose
  profile is not required by any cart item, deriving that set from each item's
  master product; in Mercur the shipping profile belongs to the offer (the
  product link is one-to-one and the first offerer wins it), so in a
  multi-seller cart holding a co-sold product every other seller's method is
  judged orphaned and checkout fails. See
  https://github.com/mercurjs/mercur/issues/1442.

  The cleanup is disabled rather than re-derived from the offer because the
  offer is not present on the cart this workflow receives: `refreshCartItems`
  refetches with a field list it captured by reference at module-load time, so
  adding a field to that list no longer reaches the already-composed workflow.

  **Consequence:** a genuinely orphaned method now survives — remove a seller's
  last item and their shipping method stays on the cart. Dropping it belongs to
  Mercur's own cart flows.

Removable once the equivalent fix lands upstream in Medusa.
