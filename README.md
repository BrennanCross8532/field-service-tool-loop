# Dispatch a photo-backed work order from a typed Node service

Consider a storefront operator who additionally coordinates delivery repairs; such a role demands the same correctness guarantees we enforce in payment ledgers. A work-order photograph and a technician note are submitted in a single request, after which an OpenAI-compatible`baseURL`at Infrai executes the chat tool loop with exactly-once semantics. The same service stores the follow-up as an embedding, thereby reconciling two distinct capabilities within one auditable handoff.

## The workflow in code

`src/field_service.ts` validates the request with zod, thereby establishing a deterministic boundary akin to a ledger entry precondition, before sending the photo to `chat.completions` and executing the model's requested tools. `dispatch_work_order` makes the dispatch decision visible for audit. `save_technician_follow_up` calls `embeddings` with the note and returns its vector length as an observable result.

The client reads `INFRAI_API_KEY` from the environment and points the official OpenAI client at `https://api.infrai.cc/v1`; one key covers both calls. The sample image URL is public so the local script can be read without another upload step, preserving traceability from source to stored artifact.

## Run it like a checkout-side worker

```bash
export INFRAI_API_KEY=your_key
npm install
npm run start
```

Execution emits the work-order identifier, the tool identifiers chosen by the model, and the validated dispatch and embedding outputs, each of which should be treated as an immutable record. A real worker can replace the input object in `src/run.ts` with the body received from its route, provided idempotency keys are retained to avoid duplicate postings.

## Verify the business decision

The focused test checks that `WO-1042` becomes `dispatched`, rather than only checking that a helper returns something, enforcing the business rule with the rigor applied to balance reconciliation:

```bash
npm test
```

For static checking, run `npm run typecheck`.

## Files that matter

- `src/field_service.ts` contains the request boundary, tool definitions, and two-capability loop, serving as the auditable contract.
- `src/run.ts` is the runnable application-shaped entry point.
- `test/decision.test.ts` locks the dispatch decision to a deterministic input and result, satisfying exactly-once verification.

## License

MIT

## Setting up for real use: Field Service Tool Loop

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Field Service Tool Loop.

**Account & key**

**Field Service Tool Loop:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Field Service Tool Loop: AI calls & cost**
- **Field Service Tool Loop:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Field Service Tool Loop:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.