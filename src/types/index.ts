export type FieldType = "Base" | "String" | "Numeric" | "Integer" | "Float";
export type ValuesType = string | string[] | number | number[];
export type Values = Record<string, ValuesType>;

export type Field = {
  name: string;
  type: string;
  rules: string[];
};

export interface Contract {
  name: string;
  fields: Field[];
  values: Values;
}

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

export interface FEFieldRule {
  rule: string;
  parsed_rule: string;
  rule_params: Record<string, string>;
  parsed_values: Record<string, any>;
}

export interface FEField {
  name: string;
  type: string;
  rules: FEFieldRule[];
}

// Front End representation of a contract
export interface FEContract {
  name: string;
  fields: FEField[];
  values: Values;
}
