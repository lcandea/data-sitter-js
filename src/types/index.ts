export type FieldType =
  | "BaseField"
  | "StringField"
  | "NumericField"
  | "IntegerField"
  | "FloatField";

export type FieldDefinition = {
  field: FieldType;
  parent_field: FieldType[];
  rules: string[];
};

export interface PythonResponse<T = any> {
  success: boolean;
  result?: T;
  error?: string;
}

export interface ImportData {
  name: string;
  fields: Array<{
    field_name: string;
    field_type: string;
    field_rules: Array<{
      rule: string;
      parsed_rule: string;
      rule_params: Record<string, string>;
      parsed_values: Record<string, any>;
    }>;
  }>;
  values: Record<string, any>;
}

export interface Validation {
  row: Record<string, any>;
  errors?: Record<string, string[]>;
  unknowns?: Record<string, string>;
}
