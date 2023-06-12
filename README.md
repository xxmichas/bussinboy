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
  - Hang and keep the connection open indefinitely
  - Show ERR_CONNECTION_RESET page instead of the response body

## 💾 Installation

```bash
npm i @xxmichas/bussinboy
```

[npm link](https://www.npmjs.com/package/@xxmichas/bussinboy)

## 📖 Usage

```ts
import http2 from "http2";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { BussinboyErrorMessages, BussinboyLimitError, BussinboyLimits, bussinboy } from "@xxmichas/bussinboy/dist";

const { HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH, HTTP2_HEADER_STATUS, HTTP2_HEADER_CONTENT_TYPE } = http2.constants;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http2.createSecureServer({
  allowHTTP1: false,
  key: readFileSync(path.join(__dirname, "http.key")),
  cert: readFileSync(path.join(__dirname, "http.crt")),
});

const limits: BussinboyLimits = {
  // ...
};

const errorMessages: BussinboyErrorMessages = {
  // Define your own error messages here, so you can easily return them to the client
  // instead of having to check BussinboyLimitError.code
};

server.on("stream", async (stream, headers) => {
  const path = headers[HTTP2_HEADER_PATH];
  const method = headers[HTTP2_HEADER_METHOD];

  if (path === "/" && method === "GET") {
    const html = `
    <form method="POST" enctype="multipart/form-data">
      <input type="text" name="name" />
      <input type="file" name="file" />
      <input type="email" name="email" />
      <input type="file" name="multiple-files" multiple />
      <input type="submit" />
    </form>
  `;

    stream.respond({
      [HTTP2_HEADER_STATUS]: 200,
      [HTTP2_HEADER_CONTENT_TYPE]: "text/html",
    });
    stream.end(html);

    return;
  }

  if (path === "/" && method === "POST") {
    try {
      const data = await bussinboy({ headers, limits, errorMessages }, stream);

      const { fields, files } = data;
      console.log(fields, files);

      stream.respond({
        [HTTP2_HEADER_STATUS]: 200,
      });
      stream.end("OK");

      return;
    } catch (error) {
      let message = "Internal Server Error";
      let status = 500;

      if (error instanceof BussinboyLimitError) {
        // It's safe to return the error message to the client
        message = error.message;
        status = 413;
      }

      try {
        stream.respond({
          [HTTP2_HEADER_STATUS]: status,
        });
        stream.end(message);

        // Very important to close the stream, otherwise the browser may hang
        stream.close();
      } catch {}

      return;
    }
  }

  stream.respond({
    [HTTP2_HEADER_STATUS]: 404,
  });
  stream.end();
});

server.listen({ port: 3000 }, () => {
  console.log("Server listening on port 3000");
});
```
