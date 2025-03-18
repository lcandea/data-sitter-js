/**
 * data-sitter.ts
 * A TypeScript wrapper for using data-sitter validation in the browser
 */

import type {
  PythonResponse,
  ImportData,
  Validation,
  FieldDefinition,
} from "../types";
import initDataSitterText from "./init_datasitter.py";
import { PyodideInterface } from "pyodide";

const DATA_SITTER_VERSION = "0.1.4";

declare global {
  interface Window {
    loadPyodide?: () => Promise<PyodideInterface>;
  }
}

// Workaround: import { loadPyodide } from "pyodide" -> The dependency might be incompatible with the dep optimizer.
export async function loadPyodideFromCDN(): Promise<PyodideInterface> {
  // If Pyodide is already loaded, return the global instance
  if (typeof window !== "undefined" && window.loadPyodide) {
    return window.loadPyodide();
  }

  // Load the script from CDN
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/pyodide/v0.27.3/full/pyodide.js";

  // Wait for the script to load
  await new Promise<void>((resolve, reject) => {
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pyodide"));
    document.head.appendChild(script);
  });

  // Now the global loadPyodide function should be available
  return window.loadPyodide!();
}

class DataSitterValidator {
  private pyodide: PyodideInterface | null = null;
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the Pyodide environment and install data-sitter
   * @returns {Promise<void>} A promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized) {
      return Promise.resolve();
    }

    // If initialization is in progress, return the existing promise
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    // Start initialization
    this.isInitializing = true;

    // Create a promise that will be resolved when initialization is complete
    this.initPromise = new Promise<void>(async (resolve, reject) => {
      try {
        console.log("Loading Pyodide...");
        this.pyodide = await loadPyodideFromCDN();
        if (!this.pyodide) {
          throw new Error("Pyodide is null.");
        }

        console.log("Loading micropip...");
        await this.pyodide.loadPackage("micropip");

        console.log("Installing data-sitter and pandas...");
        await this.pyodide.runPythonAsync(`
          import micropip
          await micropip.install("pandas")
          await micropip.install('data-sitter==${DATA_SITTER_VERSION}')
        `);

        await this.pyodide.runPythonAsync(initDataSitterText);

        this.isInitialized = true;
        this.isInitializing = false;
        console.log("DataSitterValidator initialized successfully");
        resolve();
      } catch (error) {
        this.isInitializing = false;
        console.error("Failed to initialize DataSitterValidator:", error);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });

    return this.initPromise;
  }

  async executePython<T>(
    functionName: string,
    params: Record<string, any> = {}
  ): Promise<PythonResponse<T>> {
    await this.initialize();

    try {
      const pyodide = this.pyodide;
      if (!pyodide) {
        throw new Error("Pyodide not initialized");
      }

      const pythonFunction = pyodide.globals.get(functionName);
      if (!pythonFunction) {
        throw new Error(`Python Function not found: ${functionName}`);
      }
      const resultStr = pythonFunction.callKwargs(params);
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
}

// Create a singleton instance
const dataSitterValidator = new DataSitterValidator();

/**
 * Initialize the DataSitterValidator
 * @returns {Promise<void>}
 */
export async function initializeDataSitter(): Promise<void> {
  return dataSitterValidator.initialize();
}

/**
 * Validate data against a contract schema
 * @param {Record<string, any>} contract - The contract schema
 * @param {Record<string, any>} data - The data to validate
 * @returns {Promise<PythonResponse<Validation[]>>} - Object with success flag and result/error
 */
export async function validateData(
  contract: Record<string, any> | string,
  data: Record<string, any> | Record<string, any>[] | string
): Promise<PythonResponse<Validation[]>> {
  return dataSitterValidator.executePython("validate_objects", {
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
export async function validateCsv(
  contract: Record<string, any> | string,
  csvData: string
): Promise<PythonResponse<Validation[]>> {
  return dataSitterValidator.executePython("validate_csv", {
    contract,
    csv_data: csvData,
  });
}

/**
 * Get the Front End representation of a contract
 * @param {string} contract - JSON string of the contract schema
 * @returns {Promise<PythonResponse<ImportData>>} - Object with success flag and result/error
 */
export async function getRepresentation(
  contract: string,
  format: "JSON" | "YAML"
): Promise<PythonResponse<ImportData>> {
  return dataSitterValidator.executePython("get_front_end_contract", {
    contract,
    str_format: format,
  });
}

/**
 * Get all definitions for all fields and their rules
 * @returns {Promise<FieldDefinition[]>} - Object with success flag and result/error
 */
export async function getFieldDefinitions(): Promise<FieldDefinition[]> {
  return (await dataSitterValidator.executePython("get_field_definitions"))
    .result! as FieldDefinition[];
}

// Export the validator instance if needed
export default dataSitterValidator;
