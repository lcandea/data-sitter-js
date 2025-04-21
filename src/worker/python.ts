import initDataSitterText from "./init_datasitter.py";
import type { PyodideInterface } from "pyodide";
import type { PythonResponse } from "../types";
import { WorkerState } from "./types";

const DATA_SITTER_VERSION = "0.1.6";

// Initialize Pyodide
const state: WorkerState = {
  pyodide: null,
  isInitialized: false,
  isInitializing: false,
  initPromise: null,
};

export async function executePython<T>(
  functionName: string,
  params: Record<string, any> = {}
): Promise<PythonResponse<T>> {
  await initialize();

  try {
    if (!state.pyodide) throw new Error("Pyodide not initialized");

    const pythonFunction = state.pyodide.globals.get(functionName);
    if (!pythonFunction) {
      throw new Error(`Python Function not found: ${functionName}`);
    }

    const resultStr = await pythonFunction.callKwargs(params);
    pythonFunction.destroy();

    return JSON.parse(resultStr) as PythonResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: `JavaScript error while executing Python: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

async function initialize(): Promise<void> {
  if (state.isInitialized) return Promise.resolve();

  if (state.isInitializing && state.initPromise) {
    return state.initPromise;
  }

  state.isInitializing = true;
  state.initPromise = new Promise<void>(async (resolve, reject) => {
    try {
      console.log("Loading Pyodide...");
      const pyodide = await loadPyodideFromCDN();
      state.pyodide = pyodide;

      console.log("Loading micropip...");
      await pyodide.loadPackage("micropip");
      const micropip = pyodide.pyimport("micropip");
      await micropip.install("pandas");
      await micropip.install(`data-sitter==${DATA_SITTER_VERSION}`);
      await pyodide.runPythonAsync(initDataSitterText);

      state.isInitialized = true;
      state.isInitializing = false;
      console.log("DataSitterValidator initialized successfully");
      resolve();
    } catch (error) {
      state.isInitializing = false;
      console.error("Failed to initialize DataSitterValidator:", error);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });

  return state.initPromise;
}

declare global {
  var loadPyodide: undefined | (() => Promise<PyodideInterface>);
}

// Workaround: import { loadPyodide } from "pyodide" -> The dependency might be incompatible with the dep optimizer.
async function loadPyodideFromCDN(): Promise<PyodideInterface> {
  if (typeof self !== "undefined" && self.loadPyodide) {
    return self.loadPyodide();
  }

  importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js");
  if (!self.loadPyodide) {
    throw new Error("Failed to load Pyodide");
  }
  return self.loadPyodide();
}

// Initialize immediately when the worker starts
initialize().catch(console.error);
