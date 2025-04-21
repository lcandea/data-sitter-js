import type { PyodideInterface } from "pyodide";
import type { PythonResponse } from "../types";
import type {
  WorkerMessageType,
  WorkerMessageResponse,
  WorkerMessagePayload,
} from "../types/messages";

export interface WorkerRequest<T extends WorkerMessageType> {
  id: number;
  type: T;
  payload: WorkerMessagePayload<T>;
}

export interface WorkerState {
  pyodide: PyodideInterface | null;
  isInitialized: boolean;
  isInitializing: boolean;
  initPromise: Promise<void> | null;
}

export type MessageHandler<T extends WorkerMessageType> = (
  payload: WorkerMessagePayload<T>
) => Promise<PythonResponse<WorkerMessageResponse<T>>>;

export type MessageHandlers = {
  [K in WorkerMessageType]: MessageHandler<K>;
};
