
# JSON to TS Type

Generate TypeScript **interfaces**, **types**, **Zod schemas**, **JSON Schema**, and **GraphQL types** instantly from JSON / API responses — right inside VS Code.

[Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=AbdulOwhab.json-to-ts-type)

## ✨ Features

### 📥 **Multiple Input Formats**
- **JSON** - Standard JSON with intelligent auto-correction for common issues
- **YAML** - Full YAML support for configuration files and data
- **JSON5** - Extended JSON with comments, trailing commas, and unquoted keys
- **CSV** - Automatic conversion of tabular data to typed objects
- **JSON Lines** - Newline-delimited JSON for log files and data streams

### 📤 **Multiple Output Formats**
- **TypeScript Interface** - Clean, readable interface definitions
- **TypeScript Type** - Type aliases for flexible usage
- **Advanced Interface/Type** - Smart analysis with enhanced features
- **Zod Schema** - Runtime validation schemas with type inference
- **JSON Schema** - Standard JSON Schema specifications
- **GraphQL Types** - GraphQL type definitions for APIs

### 🧠 **Advanced Analysis (Smart Modes)**
- **Optional Property Detection** - Automatically determines optional vs required properties
- **Enum Generation** - Creates enums from repeated string values
- **Union Types** - Handles properties with varying data types
- **Pattern Recognition** - Detects emails, UUIDs, dates, URLs automatically
- **Readonly Support** - Adds readonly modifiers where appropriate
- **Type Comments** - Adds helpful type annotations

### 🛠️ **Smart Processing**
- **Auto-Correction** - Fixes common JSON formatting issues automatically
- **Format Detection** - Automatically identifies input format
- **Nested Structure Support** - Handles complex nested objects and arrays
- **Custom Naming** - User-defined type and schema names
- **Error Recovery** - Graceful handling of malformed data

## 📥 Input Format Examples

**JSON** (with auto-correction):
```json
{
  id: 1,           // Missing quotes - auto-corrected
  name: "John",
  active: true,    // Trailing comma - auto-corrected
}
```

**YAML**:
```yaml
user:
  id: 1
  name: John Doe
  email: john@example.com
  preferences:
    theme: dark
    notifications: true
```

**JSON5**:
```json5
{
  // Comments are supported
  id: 1,
  name: "John",
  unquotedKey: "value", // Unquoted keys work
  trailing: "comma",    // Trailing commas allowed
}
```

**CSV**:
```csv
id,name,email,active
1,John Doe,john@example.com,true
2,Jane Smith,jane@example.com,false
```

**JSON Lines**:
```
{"id": 1, "name": "John", "active": true}
{"id": 2, "name": "Jane", "active": false}
{"id": 3, "name": "Bob", "active": true}
```

## 📤 Output Example

```
{
  "id": 1,
  "name": "John",
  "address": {
    "city": "NY",
    "zip": 12345
  },
  "orders": [
    { "orderId": 1, "amount": 200 },
    { "orderId": 2, "amount": 150 }
  ]
}
````

➡ Generates:

```ts
interface Root {
  id: number;
  name: string;
  address: Address;
  orders: Order[];
}

interface Address {
  city: string;
  zip: number;
}

interface Order {
  orderId: number;
  amount: number;
}
```

If you choose **type** instead:

```ts
type Root = {
  id: number;
  name: string;
  address: Address;
  orders: Order[];
};

type Address = {
  city: string;
  zip: number;
};

type Order = {
  orderId: number;
  amount: number;
};
```

**Advanced TypeScript Interface** output (with smart analysis):

```ts
interface User {
  id: number;
  email: string /* email */;
  name?: string; // Optional - detected from data
  status: UserStatus; // Enum generated
  createdAt: Date | string /* ISO date */;
  readonly permissions: Permission[]; // Readonly array
  metadata: Record<string, unknown>; // Index signature
}

enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive", 
  PENDING = "pending"
}

interface Permission {
  action: string;
  resource: string;
}
```

**Zod Schema** output:

```ts
import { z } from 'zod';

export const RootSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  address: z.object({
    city: z.string(),
    zip: z.number().int()
  }),
  orders: z.array(z.object({
    orderId: z.number().int(),
    amount: z.number()
  }))
});

export type Root = z.infer<typeof RootSchema>;
```

**JSON Schema** output:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "http://example.com/root.schema.json",
  "title": "Root",
  "type": "object",
  "properties": {
    "id": { "type": "number" },
    "name": { "type": "string" },
    "address": {
      "type": "object",
      "properties": {
        "city": { "type": "string" },
        "zip": { "type": "number" }
      }
    },
    "orders": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "orderId": { "type": "number" },
          "amount": { "type": "number" }
        }
      }
    }
  }
}
```

**GraphQL Types** output:

```graphql
type Root {
  id: Int
  name: String
  address: Address
  orders: [Order]
}

type Address {
  city: String
  zip: Int
}

type Order {
  orderId: Int
  amount: Float
}
```

---

## 🛠️ Usage

### Basic Workflow
1. **Select or copy data** in your editor (supports JSON, YAML, JSON5, CSV, JSON Lines)
2. **Right-click** → **"Generate Types/Schemas from JSON"**
3. **Choose output format** from 7 available options
4. **Enter custom name** for your generated type/schema
5. **Configure options** (for Advanced formats)
6. **Generated code** is inserted at cursor position

### Step-by-Step Guide

#### 1. **Input Selection**
- Select text in editor, or
- Copy to clipboard (extension will use clipboard if no selection)
- Supports multiple formats (auto-detected)

#### 2. **Format Selection**
Choose from these output formats:

| Format | Description | Best For |
|--------|-------------|----------|
| **TypeScript Interface** | Basic interface definition | Simple type definitions |
| **TypeScript Type** | Type alias definition | Union types, complex types |
| **Advanced Interface** | Smart analysis + interface | Production code with smart features |
| **Advanced Type** | Smart analysis + type alias | Flexible types with intelligence |
| **Zod Schema** | Runtime validation schema | API validation, form handling |
| **JSON Schema** | Standard JSON Schema | API documentation, validation |
| **GraphQL Types** | GraphQL type definitions | GraphQL APIs and schemas |

#### 3. **Advanced Configuration** (Smart Formats Only)
When you choose Advanced Interface/Type, you'll get additional options:

**Quick Setup:**
- **"Use Smart Defaults"** - Recommended for most cases
- **"Configure Options"** - Fine-tune each feature

**Custom Configuration Options:**
- ✅ **Detect optional properties** - Analyze data patterns for optional fields
- ✅ **Generate enums** - Create enums from repeated string values  
- ✅ **Create union types** - Handle mixed data types intelligently
- ✅ **Add readonly modifiers** - Mark appropriate fields as readonly
- ✅ **Detect patterns** - Recognize emails, UUIDs, dates, URLs

#### 4. **Results**
- Generated code appears at your cursor position
- Success notification shows what was generated
- Format detection notification shows what input type was detected

## 🌟 Real-World Examples

### Example 1: API Response → Advanced TypeScript
**Input (JSON with patterns):**
```json
{
  "user": {
    "id": 123,
    "email": "user@example.com",
    "uuid": "550e8400-e29b-412b-bc76-1a2b3c4d5e6f",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "profile": {
      "bio": "Software developer",
      "website": "https://johndoe.dev"
    },
    "roles": ["admin", "user"]
  }
}
```

**Output (Advanced Interface with Smart Defaults):**
```typescript
interface User {
  user: UserUser;
}

interface UserUser {
  id: number;
  email: string /* email */;
  uuid: string /* uuid */;
  status: UserUserStatus;
  createdAt: Date | string /* ISO date */;
  profile: Profile;
  roles: string[];
}

enum UserUserStatus {
  ACTIVE = "active"
}

interface Profile {
  bio: string;
  website: string /* URL */;
}
```

### Example 2: Configuration File → Zod Schema
**Input (YAML config):**
```yaml
database:
  host: localhost
  port: 5432
  ssl: true
  credentials:
    username: admin
    password: secret
```

**Output (Zod Schema):**
```typescript
import { z } from 'zod';

export const ConfigSchema = z.object({
  database: z.object({
    host: z.string(),
    port: z.number().int(),
    ssl: z.boolean(),
    credentials: z.object({
      username: z.string(),
      password: z.string()
    })
  })
});

export type Config = z.infer<typeof ConfigSchema>;
```

### Example 3: CSV Data → GraphQL Types
**Input (CSV Employee Data):**
```csv
id,name,department,salary,active
1,John Smith,Engineering,75000,true
2,Jane Doe,Marketing,65000,false
```

**Output (GraphQL Types):**
```graphql
type Root {
  id: Int
  name: String
  department: String
  salary: Int
  active: Boolean
}
```

### Example 4: Malformed JSON → Auto-Fixed TypeScript
**Input (Malformed JSON):**
```json
{
  id: 1,                    // Missing quotes
  name: 'John Doe',         // Single quotes
  tags: ['user', 'admin',], // Trailing comma
}
```

**Output (Auto-corrected & Generated):**
```typescript
interface Root {
  id: number;
  name: string;
  tags: string[];
}
```

---

## ⚙️ Commands

| Command                             | Description                          |
| ----------------------------------- | ------------------------------------ |
| `Generate Types/Schemas from JSON` | Converts JSON into TypeScript, Zod, JSON Schema, or GraphQL formats |

---

## ⚡ Requirements

* VS Code **1.90.0** or later
* Works in **TypeScript** and **JavaScript** projects

---

## 🧑‍💻 Contributing

Pull requests and feature suggestions are welcome!

---

## 📄 License

[MIT](https://marketplace.visualstudio.com/items?itemName=AbdulOwhab.json-to-ts-type)



