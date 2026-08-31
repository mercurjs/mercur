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
packages, workers would race each other doing it, and a file that has already
been required cannot be un-required cleanly. `loader.ts` installs a `.js` loader
hook and compiles the patched source in place of the original on first require.

Because nothing is written, a patch that a user *also* applied through their own
package manager is detected and skipped rather than treated as a conflict.

## Lifecycle

Modelled on Expo's `patch-project`, which solves the same problem for
regenerated native projects:

| `patch-project`                 | here                                            |
| ------------------------------- | ----------------------------------------------- |
| `git apply --reverse --check`   | `isPatchApplied()` — already patched, skip       |
| `git apply` fails loudly        | failed hunk throws, naming the bug it restores   |
| patch keyed by templateChecksum | filename pins the version it was generated from  |
| changed-lines warning           | one boot log line per applied patch              |

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

- **`@medusajs+core-flows@2.17.2.patch`** — derives the shipping profiles a cart
  still requires from the offer rather than the master product, and carries the
  offer's profile on the refreshed cart so it is there to read. Upstream reads
  `item.variant.product.shipping_profile.id`, but that link is one-to-one and the
  first offerer wins it, so in a multi-seller cart holding a co-sold product every
  other seller's shipping method was deleted as an orphan and checkout failed.
  See https://github.com/mercurjs/mercur/issues/1442.

Removable once the equivalent fix lands upstream in Medusa.
