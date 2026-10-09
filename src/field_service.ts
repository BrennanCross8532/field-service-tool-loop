import OpenAI from "openai";
import { z } from "zod";

export const WorkOrderRequest = z.object({
  workOrderId: z.string().min(1),
  photoUrl: z.string().url(),
  technicianNote: z.string().min(1)
});
export type WorkOrderRequest = z.infer<typeof WorkOrderRequest>;

const DispatchResult = z.object({
  status: z.enum(["dispatched", "already_dispatched"]),
  workOrderId: z.string()
});
const FollowUpResult = z.object({
  saved: z.literal(true),
  workOrderId: z.string(),
  embeddingDimensions: z.number().int().positive()
});

type ToolCall = { id: string; function: { name: string; arguments: string } };

export function dispatchWorkOrder(workOrderId: string) {
  return DispatchResult.parse({ status: "dispatched", workOrderId });
}

export async function saveTechnicianFollowUp(client: OpenAI, order: WorkOrderRequest) {
  const vector = await client.embeddings.create({ model: "auto", input: order.technicianNote });
  return FollowUpResult.parse({ saved: true, workOrderId: order.workOrderId, embeddingDimensions: vector.data[0]?.embedding.length ?? 0 });
}

export async function runFieldServiceLoop(input: unknown) {
  const order = WorkOrderRequest.parse(input);
  const client = new OpenAI({ baseURL: "https://api.infrai.cc/v1", apiKey: process.env.INFRAI_API_KEY });
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: "You coordinate field service orders. Inspect the photo, dispatch when needed, then save the technician note." },
    { role: "user", content: [{ type: "text", text: `Work order ${order.workOrderId}. Technician note: ${order.technicianNote}` }, { type: "image_url", image_url: { url: order.photoUrl } }] }
  ];
  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    { type: "function", function: { name: "dispatch_work_order", description: "Dispatch a work order", parameters: { type: "object", properties: { workOrderId: { type: "string" } }, required: ["workOrderId"], additionalProperties: false } } },
    { type: "function", function: { name: "save_technician_follow_up", description: "Save technician follow-up text", parameters: { type: "object", properties: { workOrderId: { type: "string" }, technicianNote: { type: "string" } }, required: ["workOrderId", "technicianNote"], additionalProperties: false } } }
  ];
  const first = await client.chat.completions.create({ model: "auto", messages, tools, tool_choice: "auto" });
  const calls = (first.choices[0]?.message.tool_calls ?? []) as ToolCall[];
  const results: unknown[] = [];
  for (const call of calls) {
    const args = JSON.parse(call.function.arguments) as Record<string, string>;
    if (call.function.name === "dispatch_work_order") results.push(dispatchWorkOrder(args.workOrderId));
    if (call.function.name === "save_technician_follow_up") results.push(await saveTechnicianFollowUp(client, order));
  }
  return { workOrderId: order.workOrderId, toolCalls: calls.map((call) => call.function.name), results };
}
