# 💯 bussinboy

A small promise based wrapper for [@fastify/busboy](https://github.com/fastify/busboy) that focuses on ease of use and simplicity.

## 🛠️ Requirements

- Node.js >= 18

## ✨ Features

- Promise based
- 100% TypeScript
- Supports CJS and ESM
- Framework agnostic
- Doesn't allow fields without a name [RFC 7578 Section 4.2](https://datatracker.ietf.org/doc/html/rfc7578#section-4.2)
- Fixes an issue where [@fastify/busboy](https://github.com/fastify/busboy) becomes unresponsive when processing a field without a value
- Respects "fieldNameSize" limit that [busboy](https://github.com/mscdex/busboy) and [@fastify/busboy](https://github.com/fastify/busboy) ignore (at least as of 12.06.2023)
- Introduces 3 new limits:
  - totalFieldNamesSize
  - totalFieldsSize
  - totalFileSize

## ⚠️ Drawbacks

- Only supports multipart/form-data
- Allocates all files to buffers (no streams)

## 💾 Installation

```bash
npm i @xxmichas/bussinboy
```

[npm link](https://www.npmjs.com/package/@xxmichas/bussinboy)

## 📖 Usage

```ts
import { BussinboyErrorMessages, BussinboyEndUserError, BussinboyLimits, bussinboy } from "@xxmichas/bussinboy";

const limits: BussinboyLimits = {
  // ...
};

const errorMessages: BussinboyErrorMessages = {
  // Define your own error messages here, so you can easily return them to the client
  // instead of having to check BussinboyLimitError.code
};

try {
  const data = await bussinboy({ headers, limits, errorMessages }, req);

  const { fields, files } = data;
  console.log(fields, files);

  // ...
} catch (error) {
  let message = "Internal Server Error";
  let status = 500;

  if (error instanceof BussinboyEndUserError) {
    // It's safe to return the error message to the client
    message = error.message;
    status = 413;
  }

  // ...
}
```

## 📚 TODO

- [ ] Add more tests
- [ ] Add benchmarks
