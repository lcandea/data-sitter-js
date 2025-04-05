import { PythonResponse } from "../types";

interface WorkerResponse<T = unknown> {
  id: number;
  result: PythonResponse<T>;
}

interface PendingRequest<T> {
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
  timestamp: number;
}

export class DataSitterWorker {
  private static instance = new DataSitterWorker();
  private worker: Worker;
  private requestId = 0;
  private pendingRequests: Map<number, PendingRequest<any>> = new Map();
  private readonly requestTimeout: number;
  private cleanupInterval?: NodeJS.Timeout;

  private constructor(options: { requestTimeout?: number } = {}) {
    this.requestTimeout = options.requestTimeout ?? 30000; // Default 30s timeout

    const workerUrl = new URL("data-sitter/worker", import.meta.url);
    this.worker = new Worker(workerUrl);

    this.setupWorker();
    this.startCleanupInterval();
  }

  public static getInstance(): DataSitterWorker {
    return DataSitterWorker.instance;
  }

  private setupWorker(): void {
    // Handle messages from the worker
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { id, result } = event.data;
      const request = this.pendingRequests.get(id);

      if (request) {
        this.pendingRequests.delete(id);
        if (result.success === false && result.error) {
          request.reject(new Error(result.error));
        } else {
          if (!result.result) {
            request.reject(new Error("Empty result."));
          } else {
            request.resolve(result.result);
          }
        }
      }
    };

    // Handle worker errors
    this.worker.onerror = (error: ErrorEvent) => {
      console.error("Worker error:", error);
      this.handleWorkerError(error);
    };

    this.worker.onmessageerror = (error: MessageEvent) => {
      console.error("Worker message error:", error);
      this.handleWorkerError(error);
    };
  }

  private handleWorkerError(error: ErrorEvent | MessageEvent): void {
    const errorMessage =
      error instanceof ErrorEvent ? error.message : "Message error occurred";

    // Reject all pending requests
    this.pendingRequests.forEach((request) => {
      request.reject(new Error(`Worker error: ${errorMessage}`));
    });
    this.pendingRequests.clear();
  }

  private startCleanupInterval(): void {
    // Clean up stale requests every minute
    this.cleanupInterval = setInterval(
      () => this.cleanupStaleRequests(),
      60000
    );
  }

  private cleanupStaleRequests(): void {
    const now = Date.now();
    for (const [id, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.requestTimeout) {
        request.reject(
          new Error(`Request timeout after ${this.requestTimeout}ms`)
        );
        this.pendingRequests.delete(id);
      }
    }
  }

  /**
   * Send a message to the worker and wait for a response
   */
  async sendMessage<T>(
    action: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    const id = this.requestId++ % Number.MAX_SAFE_INTEGER; // Prevent overflow

    return new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(id, {
        resolve,
        reject,
        timestamp: Date.now(),
      });

      try {
        this.worker.postMessage({ id, action, params });
      } catch (error) {
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  /**
   * Terminate the worker and cleanup resources
   */
  terminate(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.worker.terminate();

    // Reject any pending requests
    this.pendingRequests.forEach((request) => {
      request.reject(new Error("Worker terminated"));
    });
    this.pendingRequests.clear();
  }
}
