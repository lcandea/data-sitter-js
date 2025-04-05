import type {
  ImportData,
  Validation,
  FieldDefinition,
  ContractFormat,
} from "../types";
import { DataSitterWorker } from "./ds-worker";

export class DataSitterValidator {
  private contract: Record<string, any> | string;
  private worker: DataSitterWorker;

  constructor(contract: Record<string, any> | string) {
    this.contract = contract;
    this.worker = DataSitterWorker.getInstance();
  }

  async validateData(
    data: Record<string, any> | Record<string, any>[] | string
  ): Promise<Validation[]> {
    return this.worker.sendMessage("validateData", {
      contract: this.contract,
      data,
    });
  }

  async validateCsv(csvData: string): Promise<Validation[]> {
    return this.worker.sendMessage("validateCsv", {
      contract: this.contract,
      csvData,
    });
  }

  async getRepresentation(format: ContractFormat): Promise<ImportData> {
    return this.worker.sendMessage("getRepresentation", {
      contract: this.contract,
      format,
    });
  }

  static async getFieldDefinitions(): Promise<FieldDefinition[]> {
    const worker = DataSitterWorker.getInstance();
    return worker.sendMessage<FieldDefinition[]>("getFieldDefinitions");
  }
}
