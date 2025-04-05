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

export interface Validation {
  item: Record<string, any>;
  errors?: Record<string, string[]>;
  unknowns?: Record<string, string>;
}

export interface FieldRule {
  rule: string;
  parsed_rule: string;
  rule_params: Record<string, string>;
  parsed_values: Record<string, any>;
}

export interface Field {
  field_name: string;
  field_type: string;
  field_rules: FieldRule[];
}

export interface ImportData {
  name: string;
  fields: Field[];
  values: Record<string, any>;
}
