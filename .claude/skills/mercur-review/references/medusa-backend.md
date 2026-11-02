# Medusa backend patterns (what Mercur code must match)

Paths below are relative to `~/Desktop/medusa/packages`. When unsure, open the Medusa file and copy its shape. These are the corrections the user has had to make by hand before.

## API routes: thin

Canonical files: `medusa/src/api/admin/payments/[id]/capture/route.ts` and `medusa/src/api/store/payment-collections/helpers.ts`.

A route does exactly this:

```ts
export const POST = async (req: AuthenticatedMedusaRequest<Body>, res: MedusaResponse<Response>) => {
  await xWorkflow(req.scope).run({ input: { id: req.params.id, ...req.validatedBody } })
  const entity = await refetchX(req.params.id, req.scope, req.queryConfig.fields)
  res.json({ entity })
}
```

- The refetch helper lives in the resource's `helpers.ts`: `refetchEntity({ entity, idOrFilter, scope, fields })` from `@medusajs/framework/http`.
- `GET` list/detail routes may call `query.graph` directly with `req.queryConfig.fields`, `req.filterableFields` and `req.queryConfig.pagination`.
- Validation comes from `middlewares.ts`: `validateAndTransformBody` with a zod `.strict()` schema and `validateAndTransformQuery` with `query-config.ts` defaults. Fields lists go in `query-config.ts`, never inline in the route.
- **Not allowed in a route:** `createStep`/`createWorkflow`, `service.*` calls, lookups to resolve ids, branching on entity state, running two workflows, `throwOnError: false` to paper over a failure, or reading module options.
- Webhook hook routes only emit an event (`medusa/src/api/hooks/payment/[provider]/route.ts`). The subscriber parses and runs the workflow by id (`medusa/src/subscribers/payment-webhook.ts`).

## Workflows

Canonical files: `core/core-flows/src/payment/workflows/refund-payment.ts` and `process-payment.ts`.

- **Exports:** `export const xWorkflowId = "kebab-id"`, `export type XWorkflowInput`, `export const xWorkflow = createWorkflow(xWorkflowId, function (input) { ... })`, with a short JSDoc on what it does.
- **Input:** takes ids and minimal values. The workflow loads what it needs. Don't pass data in only to forward it to an event; query it.
- **Loading:** use `useQueryGraphStep({ entity, fields, filters, options: { isList: false, throwIfKeyNotFound: true } }).config({ name: "unique-name" })`. Every repeated query step gets a unique `.config({ name })`.
- **Branching and data:** branch with `when("named-condition", { deps }, fn).then(() => ...)`, and do calculations only in `transform`.
  - **No nested `when`:** a `when` inside another `when`'s `.then` breaks the outer one at load. Use sibling `when` blocks that return values, and `transform` over the possibly-undefined result.
  - **Guard empty filters:** wrap a query in `when` if its `id: [...]` or `$or: [...]` filter could be empty.
- **Validation:** `validate-*` steps throw `MedusaError` with the right type (`NOT_FOUND`, `NOT_ALLOWED`, `INVALID_DATA`, `CONFLICT`) and return `new StepResponse(void 0)`.
- **Composition:** reuse Medusa steps (`createRemoteLinkStep`, `emitEventStep`, `useQueryGraphStep`) and Mercur steps, nest other workflows with `xWorkflow.runAsStep({ input })`, and expose extension points with `createHook`. Check `~/Desktop/medusa/packages/core/core-flows` for an existing step before writing one.
- **Helpers:** pure helpers (no container, no IO) go in `workflows/<domain>/utils/` (like `core-flows/src/payment-collection/utils`). A helper that queries or writes is a step, not a util. A ~400-line util doing query + compute + write inside one step is the anti-pattern to flag.

## Steps

Canonical files: `core/core-flows/src/payment/steps/capture-payment.ts` and `payment-collection/steps/create-payment-account-holder.ts`.

- One step per file in `steps/`, and the `steps/index.ts` barrel re-exports every file.
- Export `xStepId` + `xStep = createStep(xStepId, invoke, compensate)`.
- One module call per step. Compensation restores exactly what the step changed: delete created rows, write back the previous values captured before the update.
- No compensation only when the effect can't be undone (money sent to a provider, a link a user already got). Say so in one comment, as Medusa does in `capture-payment.ts`.
- Batch steps take arrays and tolerate `[]`.

## Module services

Canonical files: `modules/payment/src/services/payment-module.ts` and `payment-provider.ts`.

- `class XModuleService extends MedusaService({ ...models })` gives generated CRUD (`createXs`, `updateXs`, `listXs`, ...). Custom methods use domain verbs that don't collide with the generated ones (`capturePayment`, `refundPayment`, `createAccountHolder`).
- **Decorators:**
  - Public methods that write: `@InjectManager() @EmitEvents()` with `@MedusaContext() sharedContext?: Context`.
  - Internal transactional writers: `protected async x_()` with `@InjectTransactionManager()`.
  - Provider calls: `protected async xFromProvider_()`, outside the transaction, so a row lock (`knex(table).where("id", id).forUpdate()` after `SET LOCAL lock_timeout`) is never held across a network call.
- **No free functions or module-scope helpers** in the service file. Helpers become `protected` methods, and constants become `static readonly`. Status derivation lives in the service (like `maybeUpdatePaymentCollection_`), not in `utils/`.
- Provider access goes through a provider service (`retrieveProvider` from the container). Optional provider methods are guarded.
- Modules never import other modules. Cross-module data goes through links (`defineLink`) and workflows. Module migrations never touch other modules' tables.

## Links, query, events

- Links are created in workflows via `createRemoteLinkStep`, not with `link.create` inside a util.
- `query.graph` can't filter by a cross-module link relation in every case. Check the existing Mercur usage first.
- A link alias that matches a relation name on the same module silently breaks resolution (e.g. `images` on ProductCategory).
- `fields` params: unprefixed fields replace route defaults; prefix with `+`/`-` to merge.
- Events: `emitEventStep({ eventName, data })` in the workflow, with names from `@mercurjs/types` constants.

## Overrides of Medusa routes

Overriding a core Medusa route's validation needs the route file **and** the middleware listed in `disableMedusaMiddlewares`. A handler override alone still returns 400 for unrecognized fields.

## Tests

- Bug fixes ship with a failing test first.
- Integration specs use `medusaIntegrationTestRunner` and the `integration-tests/helpers`, split by `admin` / `vendor` / `store`. Use the `createVendorProduct` helper for products.
- Run only the touched specs: `bun run test:integration:http -- <pattern>`.
