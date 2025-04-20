import initDataSitterText from "./init_datasitter.py";
import type { PyodideInterface } from "pyodide";
import type {
  Contract,
  FEContract,
  PythonResponse,
  Validation,
  FieldDefinition,
} from "../types";

// Initialize Pyodide
let pyodide: PyodideInterface | null = null;
let isInitialized = false;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

const DATA_SITTER_VERSION = "0.1.6";

declare global {
  var loadPyodide: undefined | (() => Promise<PyodideInterface>);
}

// Workaround: import { loadPyodide } from "pyodide" -> The dependency might be incompatible with the dep optimizer.
export async function loadPyodideFromCDN(): Promise<PyodideInterface> {
  if (typeof self !== "undefined" && self.loadPyodide) {
    return self.loadPyodide();
  }

  importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js");
  if (!self.loadPyodide) {
    throw new Error("Failed to load Pyodide");
  }
  return self.loadPyodide();
}

// Handle messages from the main thread
self.onmessage = async (event: MessageEvent) => {
  const { id, action, params } = event.data;

  try {
    let result;
    switch (action) {
      case "fromJson":
        result = await fromJson(params.contract);
        break;
      case "fromYaml":
        result = await fromYaml(params.contract);
        break;
      case "toJson":
        result = await toJson(params.contract, params.indent);
        break;
      case "toYaml":
        result = await toYaml(params.contract, params.indent);
        break;
      case "validateData":
        result = await validateData(params.contract, params.data);
        break;
      case "validateCsv":
        result = await validateCsv(params.contract, params.csvData);
        break;
      case "getRepresentation":
        result = await getRepresentation(params.contract);
        break;
      case "getFieldDefinitions":
        result = await getFieldDefinitions();
        break;
      default:
        result = { success: false, error: `Unknown action: ${action}` };
    }

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

async function initialize(): Promise<void> {
  if (isInitialized) return Promise.resolve();

  if (isInitializing && initPromise) {
    return initPromise;
  }
  isInitializing = true;
  initPromise = new Promise<void>(async (resolve, reject) => {
    try {
      console.log("Loading Pyodide...");
      pyodide = await loadPyodideFromCDN();

      console.log("Loading micropip...");
      await pyodide.loadPackage("micropip");
      const micropip = pyodide.pyimport("micropip");
      await micropip.install("pandas");
      await micropip.install(`data-sitter==${DATA_SITTER_VERSION}`);
      await pyodide.runPythonAsync(initDataSitterText);

      isInitialized = true;
      isInitializing = false;
      console.log("DataSitterValidator initialized successfully");
      resolve();
    } catch (error) {
      isInitializing = false;
      console.error("Failed to initialize DataSitterValidator:", error);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
  return initPromise;
}

async function executePython<T>(
  functionName: string,
  params: Record<string, any> = {}
): Promise<PythonResponse<T>> {
  await initialize();

  try {
    if (!pyodide) throw new Error("Pyodide not initialized");

    const pythonFunction = pyodide.globals.get(functionName);
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

async function validateData(
  contract: Contract,
  data: Record<string, any> | Record<string, any>[] | string
): Promise<PythonResponse<Validation[]>> {
  return executePython("validate_objects", {
    contract,
    data,
  });
}

async function validateCsv(
  contract: Contract,
  csvData: string
): Promise<PythonResponse<Validation[]>> {
  return executePython("validate_csv", {
    contract,
    csv_data: csvData,
  });
}

async function fromJson(contract: string): Promise<PythonResponse<Contract>> {
  return executePython("from_json", { contract });
}

async function fromYaml(contract: string): Promise<PythonResponse<Contract>> {
  return executePython("from_yaml", { contract });
}

async function toJson(
  contract: Contract,
  indent: number = 2
): Promise<PythonResponse<string>> {
  return executePython("to_json", { contract, indent });
}

async function toYaml(
  contract: Contract,
  indent: number = 2
): Promise<PythonResponse<string>> {
  return executePython("to_yaml", { contract, indent });
}

async function getRepresentation(
  contract: Contract
): Promise<PythonResponse<FEContract>> {
  return executePython("get_front_end_contract", {
    contract,
  });
}

async function getFieldDefinitions(): Promise<
  PythonResponse<FieldDefinition[]>
> {
  return executePython("get_field_definitions");
}

// Initialize immediately when the worker starts
initialize().catch(console.error);
