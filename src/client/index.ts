import type { ImportData, Validation, FieldDefinition } from "../types";
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

  static async fromJson(contract: string): Promise<DataSitterValidator> {
    const worker = DataSitterWorker.getInstance();
    return new DataSitterValidator(
      await worker.sendMessage("fromJson", { contract })
    );
  }

  static async fromYaml(contract: string): Promise<DataSitterValidator> {
    const worker = DataSitterWorker.getInstance();
    return new DataSitterValidator(
      await worker.sendMessage("fromYaml", { contract })
    );
  }

  async getRepresentation(): Promise<ImportData> {
    return this.worker.sendMessage("getRepresentation", {
      contract: this.contract,
    });
  }

  static async getFieldDefinitions(): Promise<FieldDefinition[]> {
    const worker = DataSitterWorker.getInstance();
    return worker.sendMessage<FieldDefinition[]>("getFieldDefinitions");
  }
}
