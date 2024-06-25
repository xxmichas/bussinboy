# 💯 bussinboy

A small promise based wrapper for [@fastify/busboy](https://github.com/fastify/busboy) that focuses on ease of use and simplicity.

## 🛠️ Requirements

- Node.js >= 20

## ✨ Features

- Promise based
- 100% TypeScript
- Supports CJS and ESM
- Framework agnostic
- Doesn't allow fields without a name [RFC 7578 Section 4.2](https://datatracker.ietf.org/doc/html/rfc7578#section-4.2)
- Fixes an issue where [@fastify/busboy](https://github.com/fastify/busboy) becomes unresponsive when processing a field without a value
- Respects "fieldNameSize" limit that [busboy](https://github.com/mscdex/busboy) and [@fastify/busboy](https://github.com/fastify/busboy) ignore (at least as of 12.06.2023)
- Introduces 4 new limits:
  - bodySize
  - totalFieldNamesSize
  - totalFieldsSize
  - totalFileSize
- Stops processing data after bodySize limit is reached (doesn't waste resources). Note: If you choose to use "bodySize" limit, make sure to append a "Connection": "close" header to the response. Aborting an upload and sending a response early in http1, before a request is fully read may cause [most browsers](https://bugs.chromium.org/p/chromium/issues/detail?id=174906) to either:
  - Continue uploading payload
  - Hang and keep the connection open indefinitely
  - Show ERR_CONNECTION_RESET page instead of the response body

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
