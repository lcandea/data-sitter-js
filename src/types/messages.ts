import type {
  Contract,
  Validation,
  FEContract,
  FieldDefinition,
} from "./index";

export type WorkerMessage =
  | {
      type: "validateData";
      payload: {
        contract: Contract;
        data: Record<string, any> | Record<string, any>[] | string;
      };
      response: Validation[];
    }
  | {
      type: "validateCsv";
      payload: { contract: Contract; csvData: string };
      response: Validation[];
    }
  | {
      type: "toJson";
      payload: { contract: Contract; indent: number };
      response: string;
    }
  | {
      type: "toYaml";
      payload: { contract: Contract; indent: number };
      response: string;
    }
  | {
      type: "fromJson";
      payload: { contract: string };
      response: Contract;
    }
  | {
      type: "fromYaml";
      payload: { contract: string };
      response: Contract;
    }
  | {
      type: "getRepresentation";
      payload: { contract: Contract };
      response: FEContract;
    }
  | {
      type: "getFieldDefinitions";
      payload: undefined;
      response: FieldDefinition[];
    };

export type WorkerMessageType = WorkerMessage["type"];
export type WorkerMessagePayload<T extends WorkerMessageType> = Extract<
  WorkerMessage,
  { type: T }
>["payload"];
export type WorkerMessageResponse<T extends WorkerMessageType> = Extract<
  WorkerMessage,
  { type: T }
>["response"];
