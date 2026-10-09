import assert from "node:assert/strict";
import { dispatchWorkOrder } from "../src/field_service.js";

const result = dispatchWorkOrder("WO-1042");
assert.deepEqual(result, { status: "dispatched", workOrderId: "WO-1042" });
console.log("dispatch decision test passed");
