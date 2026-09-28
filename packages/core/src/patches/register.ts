import { disabledPatchesFromEnv, ensureMercurPatches } from "./index"

// A config's imports are evaluated before any call in it, so anything imported
// next to `@mercurjs/core` in `medusa-config.ts` loads before `withMercur()` runs.
// Patching has to happen here, on import: a workflow composed from unpatched
// source never gains the hooks a patch adds, so a block that registers a hook
// handler at import time would find it missing.
ensureMercurPatches({ disabled: disabledPatchesFromEnv() })
