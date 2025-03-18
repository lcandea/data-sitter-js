# Data-Sitter JS

A browser-based web worker implementation of the data-sitter validation library.

## Features

- Runs entirely in the browser with no server-side dependencies
- Uses Web Workers for non-blocking validation operations
- Automatically initializes Pyodide and installs dependencies
- Simple API for data validation
- TypeScript support with full type definitions
- Supports validation of JSON data and CSV files

## Installation

```bash
npm install data-sitter
```

## Usage

### Basic Usage

```typescript
import { validateData, initializeDataSitter } from 'data-sitter';

// Initialize the library (optional, will happen automatically on first use)
await initializeDataSitter();

// Define your contract schema
const contract = {
  name: "User",
  fields: [
    {
      field_name: "ID",
      field_type: "IntegerField",
      field_rules: ["Positive"],
    },
    {
      field_name: "First Name",
      field_type: "StringField",
      field_rules: [
        "Validate Not Null",
        "Is not empty",
        "Length between $values.min_length and $values.max_length",
      ],
    },
    {
      field_name: "Age",
      field_type: "IntegerField",
      field_rules: ["Positive", "Between 18 and 99"],
    },
    {
      field_name: "Title",
      field_type: "StringField",
      field_rules: ["Value in ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.']"],
    },
  ],
  values: {
    min_length: 2,
    max_length: 50,
  },
};

// Data to validate
const data = {
  ID: 1,
  "First Name": "John",
  Age: 21,
  Title: "Mr.",
};

// Validate the data
const result = await validateData(contract, data);

if (result.success) {
  console.log("Validation results:", result.result);
} else {
  console.error("Error:", result.error);
}
```

### Validating CSV Data

```typescript
import { validateCsv } from 'data-sitter';


const csvData = `ID,First Name,Age,Title
1,John,12,Mr.
2,Mery,30,Ms.
`
const result = await validateCsv(contract, csvData);

if (result.success) {
  console.log("Validation results:", result.result);
} else {
  console.error("Error:", result.error);
}
```

### Getting Field Definitions

```typescript
import { getFieldDefinitions } from 'data-sitter';

const definitions = await getFieldDefinitions();
console.log("Available field definitions:", definitions);
```

### Getting Contract Representation

```typescript
import { getRepresentation } from 'data-sitter';

const representation = await getRepresentation(contract);
console.log("Contract representation:", representation.result);
```

## Browser Support

This library requires browsers that support:
- Web Workers
- ES Modules
- SharedArrayBuffer (for Pyodide)

## Performance Considerations

- The first initialization of Pyodide and data-sitter may take a few seconds
- Subsequent calls will be much faster as the environment is already initialized
- The library uses a single web worker instance for all operations to minimize overhead

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
