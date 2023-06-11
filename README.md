# 💯 bussinboy

A small promise based wrapper for [@fastify/busboy](https://github.com/fastify/busboy) that focuses on ease of use and simplicity.

## 🛠️ Requirements

- Node.js >= 14
- http2

## ✨ Features

- Promise based
- 100% TypeScript
- Supports CJS and ESM
- Framework agnostic
- Stops processing data after any of the limits are reached (doesn't waste CPU resources)
- Respects "fieldNameSize" limit that [busboy](https://github.com/mscdex/busboy) and [@fastify/busboy](https://github.com/fastify/busboy) ignore (at least as of 12.06.2023)
- Introduces 3 new limits:

  - totalFieldNamesSize
  - totalFieldsSize
  - totalFileSize

## ⚠️ Drawbacks

- Only supports multipart/form-data
- Allocates all files to buffers (no streams)
- http2 only - aborting an upload (sending 413) in http1 causes [most browsers](https://bugs.chromium.org/p/chromium/issues/detail?id=174906) to either:
  - Continue uploading payload
  - Hang and keep the connection open indefinetely
  - Show ERR_CONNECTION_RESET page instead of the response body

## 💾 Installation

```bash
npm i @xxmichas/bussinboy
```

[npm link](https://www.npmjs.com/package/@xxmichas/bussinboy)
