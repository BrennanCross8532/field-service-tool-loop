import { runFieldServiceLoop } from "./field_service.js";

const input = {
  workOrderId: "WO-1042",
  photoUrl: "https://example.com/photos/van-door.jpg",
  technicianNote: "Replace the worn door seal before the next delivery route."
};

runFieldServiceLoop(input)
  .then((result) => console.log(JSON.stringify(result, null, 2)))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
