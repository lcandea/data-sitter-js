import type {
  Contract,
  FEContract,
  Validation,
  FieldDefinition,
} from "../types";
import { DataSitterWorker } from "./ds-worker";

export class DataSitterValidator {
  private contract: Contract;
  private worker: DataSitterWorker;

  constructor(contract: Contract) {
    this.contract = contract;
    this.worker = DataSitterWorker.getInstance();
  }

  async validateData(
    data: Record<string, any> | Record<string, any>[] | string
  ): Promise<Validation[]> {
    return this.worker.sendTypedMessage("validateData", {
      contract: this.contract,
      data,
    });
  }

  async validateCsv(csvData: string): Promise<Validation[]> {
    return this.worker.sendTypedMessage("validateCsv", {
      contract: this.contract,
      csvData,
    });
  }

  async toJson(indent: number = 2): Promise<string> {
    return this.worker.sendTypedMessage("toJson", {
      contract: this.contract,
      indent,
    });
  }

  async toYaml(indent: number = 2): Promise<string> {
    return this.worker.sendTypedMessage("toYaml", {
      contract: this.contract,
      indent,
    });
  }

  static async fromJson(contract: string): Promise<DataSitterValidator> {
    const worker = DataSitterWorker.getInstance();
    return new DataSitterValidator(
      await worker.sendTypedMessage("fromJson", { contract })
    );
  }

  static async fromYaml(contract: string): Promise<DataSitterValidator> {
    const worker = DataSitterWorker.getInstance();
    return new DataSitterValidator(
      await worker.sendTypedMessage("fromYaml", { contract })
    );
  }

  async getRepresentation(): Promise<FEContract> {
    return this.worker.sendTypedMessage("getRepresentation", {
      contract: this.contract,
    });
  }

  static async getFieldDefinitions(): Promise<FieldDefinition[]> {
    const worker = DataSitterWorker.getInstance();
    return worker.sendTypedMessage("getFieldDefinitions", undefined);
  }
}
