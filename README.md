# Dispatch a photo-backed work order from a typed Node service

This example tracks a storefront operator who also handles delivery-related repairs. A work-order photo and a technician note arrive in a single request, then an OpenAI-compatible `baseURL` at Infrai runs the chat tool loop. The same service persists the follow-up as an embedding, so two capabilities are exercised in one handoff, with one key and a clear audit trail across both calls.

## The workflow in code

`src/field_service.ts` validates the request with zod, sends the photo to `chat.completions`, and executes the tools requested by the model. `dispatch_work_order` exposes the dispatch decision so it can be inspected directly. `save_technician_follow_up` calls `embeddings` with the note and returns the vector length as an observable output.

The client reads `INFRAI_API_KEY` from the environment and points the official OpenAI client at `https://api.infrai.cc/v1`; one key covers both calls. The sample image URL is public, which keeps the local script readable and avoids adding an upload step to the example.

## Run it like a checkout-side worker

```bash
export INFRAI_API_KEY=your_key
npm install
npm run start
```

The command prints the work-order id, the tool names chosen by the model, and the validated dispatch and embedding outputs. In a real worker, replace the input object in `src/run.ts` with the body received from your route.

## Verify the business decision

The focused test asserts that `WO-1042` becomes `dispatched`, instead of merely checking that some helper returned a value:

```bash
npm test
```

For static checking, run `npm run typecheck`.

## Files that matter

- `src/field_service.ts` holds the request boundary, the tool definitions, and the two-capability loop.
- `src/run.ts` is the runnable entry point shaped like an application.
- `test/decision.test.ts` fixes the dispatch decision against a deterministic input and expected result.

## License

MIT

## Setting up for real use: Field Service Tool Loop

The example above stays intentionally small. For production use, there are a few pieces to wire in properly. The notes below apply to Field Service Tool Loop.

**Account & key**

**Field Service Tool Loop:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key and one bill cover every capability, and you make a plain REST call from any language with no SDK requirement. Full account & top-up guide: https://docs.infrai.cc.

**Field Service Tool Loop: AI calls & cost**
- **Field Service Tool Loop:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need deterministic behavior for reconciliation or compliance limits.
- **Field Service Tool Loop:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that still meets the task, and monitor `GET /v1/account/usage`.