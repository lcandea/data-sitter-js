import initDataSitterText from "./init_datasitter.py";
import type { PyodideInterface } from "pyodide";
import type {
  PythonResponse,
  ImportData,
  Validation,
  FieldDefinition,
  ContractFormat,
} from "../types";

// Initialize Pyodide
let pyodide: PyodideInterface | null = null;
let isInitialized = false;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

const DATA_SITTER_VERSION = "0.1.4";

declare global {
  var loadPyodide: undefined | (() => Promise<PyodideInterface>);
}

// Workaround: import { loadPyodide } from "pyodide" -> The dependency might be incompatible with the dep optimizer.
export async function loadPyodideFromCDN(): Promise<PyodideInterface> {
  if (typeof self !== "undefined" && self.loadPyodide) {
    return self.loadPyodide();
  }

  importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.3/full/pyodide.js");
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
      case "initialize":
        await initialize();
        result = { success: true };
        break;
      case "validateData":
        result = await validateData(params.contract, params.data);
        break;
      case "validateCsv":
        result = await validateCsv(params.contract, params.csvData);
        break;
      case "getRepresentation":
        result = await getRepresentation(params.contract, params.format);
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

/**
 * Initialize the Pyodide environment and install data-sitter
 */
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

      console.log("Installing data-sitter and pandas...");
      await pyodide.runPythonAsync(`
        import micropip
        await micropip.install("pandas")
        await micropip.install('data-sitter==${DATA_SITTER_VERSION}')
      `);
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

/**
 * Execute a Python function with the given parameters
 */
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

/**
 * Validate data against a contract schema
 * @param {Record<string, any>} contract - The contract schema
 * @param {Record<string, any>[]} data - The data to validate
 * @returns {Promise<PythonResponse<Validation[]>>} - Object with success flag and result/error
 */
async function validateData(
  contract: Record<string, any> | string,
  data: Record<string, any> | Record<string, any>[] | string
): Promise<PythonResponse<Validation[]>> {
  return executePython("validate_objects", {
    contract,
    data,
  });
}

/**
 * Validate data in CSV format against a contract schema
 * @param {Record} contract - JSON string of the contract schema
 * @param {string} csvData - JSON string of the CSV to validate
 * @returns {Promise<PythonResponse<Validation[]>>} - Object with success flag and result/error
 */
async function validateCsv(
  contract: Record<string, any> | string,
  csvData: string
): Promise<PythonResponse<Validation[]>> {
  return executePython("validate_csv", {
    contract,
    csv_data: csvData,
  });
}

/**
 * Get the Front End representation of a contract
 * @param {string} contract - JSON string of the contract schema
 * @returns {Promise<PythonResponse<ImportData>>} - Object with success flag and result/error
 */
async function getRepresentation(
  contract: string,
  format: ContractFormat
): Promise<PythonResponse<ImportData>> {
  return executePython("get_front_end_contract", {
    contract,
    str_format: format,
  });
}

/**
 * Get all definitions for all fields and their rules
 * @returns {Promise<PythonResponse<FieldDefinition[]>>} - Object with success flag and result/error
 */
async function getFieldDefinitions(): Promise<
  PythonResponse<FieldDefinition[]>
> {
  return executePython("get_field_definitions");
}

// Initialize immediately when the worker starts
initialize().catch(console.error);
