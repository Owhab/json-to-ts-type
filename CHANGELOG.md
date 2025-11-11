## [0.1.0] - 2024-12-19

### 🚀 Major Release: Multi-Format Support & Advanced Analysis

#### 📥 Multiple Input Formats Added
- **YAML Support**: Full YAML parsing for configuration files and data structures
- **JSON5 Format**: Support for comments, trailing commas, and unquoted keys
- **CSV Conversion**: Automatic conversion of tabular data to typed objects
- **JSON Lines**: Support for newline-delimited JSON (logs, streams)
- **Auto-Correction**: Intelligent fixing of malformed JSON (missing quotes, trailing commas, single quotes)

#### 📤 Multiple Output Formats Added
- **Zod Schemas**: Generate runtime validation schemas with type inference
- **JSON Schema**: Standard JSON Schema specifications for API documentation
- **GraphQL Types**: Generate GraphQL type definitions for APIs
- **Advanced TypeScript**: Smart analysis with enhanced features

#### 🧠 Advanced Analysis Features
- **Optional Property Detection**: Automatically determine optional vs required properties
- **Enum Generation**: Create enums from repeated string values
- **Union Type Creation**: Handle properties with varying data types intelligently
- **Pattern Recognition**: Automatically detect emails, UUIDs, dates, URLs
- **Readonly Support**: Add readonly modifiers where appropriate
- **Type Comments**: Helpful annotations for recognized patterns

#### 🛠️ Enhanced User Experience
- **Auto-Format Detection**: Intelligently identifies input format
- **Interactive Configuration**: Choose between smart defaults or custom options
- **Custom Naming**: User-defined type and schema names
- **Better Error Messages**: Graceful error handling with helpful feedback
- **Success Notifications**: Confirmation of successful generation

#### 🔧 Technical Improvements
- **Smart Processing**: Multi-sample analysis for better type inference
- **Error Recovery**: Multiple parsing strategies for malformed data
- **Modular Architecture**: Clean separation of concerns for maintainability
- **Type Safety**: Full TypeScript type coverage

#### 📚 Documentation
- **Comprehensive README**: Complete usage guide with real-world examples
- **Format Comparison**: When to use each output format
- **Step-by-Step Guide**: Detailed workflow instructions

### Dependencies Added
- `js-yaml`: YAML parsing support
- `json5`: JSON5 format parsing
- `csv-parse`: CSV data processing
- `zod`: Runtime schema validation

### Breaking Changes
- Command renamed from "Generate Type/Interface from JSON" to "Generate Types/Schemas from JSON"
- Additional format selection step in workflow

## [0.0.6] - 2025-09-18

### Update

- Changed the icon of the extension

## [0.0.5] - 2025-08-20

### Update

- updated displayname of the the extension

## [0.0.4] - 2025-08-20

### Update

- added extension icon

## [0.0.3] - 2025-08-19

### Update

- add @types/underscore dependency and update tsconfig formatting

## [0.0.2] - 2025-08-19

### Added

- Feature: option to generate `type` instead of `interface`

### Fixed

- Bug: JSON parsing for nested objects

## [0.0.1] - 2025-08-19

### Added

- Support for clipboard JSON input
- Command registered in editor context menu

### Fixed

- README links
