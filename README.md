
````markdown
# JSON to TS Type

Generate TypeScript **interfaces** or **types** instantly from JSON / API responses — right inside VS Code.

## ✨ Features

- 🚀 Convert selected JSON or clipboard content into TypeScript types/interfaces  
- 🔁 Supports **nested objects** and arrays  
- 🔎 Automatically detects and reuses duplicate object shapes  
- ⚡ Choice between `interface` and `type` output  
- 🧩 Works with REST/GraphQL API responses, mock data, or any JSON  

Example:

```json
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

---

## 🛠️ Usage

1. Copy or select JSON text in your editor.
2. Right-click → **Generate Type/Interface from JSON**
3. Choose whether to output as `interface` or `type`.
4. The generated code is inserted into your file.

---

## ⚙️ Commands

| Command                             | Description                          |
| ----------------------------------- | ------------------------------------ |
| `Generate Type/Interface from JSON` | Converts JSON into TypeScript models |

---

## ⚡ Requirements

* VS Code **1.90.0** or later
* Works in **TypeScript** and **JavaScript** projects

---

## 📦 Extension Settings

Future versions will allow you to configure:

* Default output style (`type` or `interface`)
* Naming conventions for root objects
* Auto-insert at cursor vs. new file

---

## 🧑‍💻 Contributing

Pull requests and feature suggestions are welcome!

---

## 📄 License

[MIT](LICENSE)

