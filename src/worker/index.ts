import type { WorkerMessageType } from "../types/messages";
import type { WorkerRequest } from "./types";
import { handlers } from "./handlers";

// Handle messages from the main thread
self.onmessage = async <T extends WorkerMessageType>(
  event: MessageEvent<WorkerRequest<T>>
) => {
  const { id, type, payload } = event.data;

  try {
    const handler = handlers[type];
    if (!handler) {
      throw new Error(`No handler found for message type: ${type}`);
    }

    const result = await handler(payload);

    // Send the result back to the main thread
    self.postMessage({ id, result });
  } catch (error) {
    // Send any errors back to the main thread
    self.postMessage({
      id,
      result: {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
};
