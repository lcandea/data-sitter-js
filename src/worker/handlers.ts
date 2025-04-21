import type { MessageHandlers } from "./types";
import { executePython } from "./python";

export const handlers: MessageHandlers = {
  validateData: async (payload) => executePython("validate_objects", payload),

  validateCsv: async (payload) => executePython("validate_csv", payload),

  fromJson: async (payload) => executePython("from_json", payload),

  fromYaml: async (payload) => executePython("from_yaml", payload),

  toJson: async (payload) => executePython("to_json", payload),

  toYaml: async (payload) => executePython("to_yaml", payload),

  getRepresentation: async (payload) =>
    executePython("get_front_end_contract", payload),

  getFieldDefinitions: async () => executePython("get_field_definitions", {}),
};
