// @ts-check
import assert from "assert/strict";
import { describe, it } from "node:test";
import { bussinboy } from "../../dist/index.js";
import {
  headers,
  createMultipartFieldChunk,
  createMultipartFormDataStream,
  boundary,
  createMultipartFileChunk,
} from "../utils.mjs";

describe("invalid or malformed data", () => {
  it("should throw an error if content-type header is missing", async () => {
    const stream = createMultipartFormDataStream(createMultipartFieldChunk("test-name", "test-value"));

    try {
      await bussinboy({ headers: {} }, stream);

      assert.fail("should have thrown");
    } catch (error) {
      assert.strictEqual(error.message, "Content-Type header is not set to multipart/form-data");
    }
  });

  it("should throw an error if content-type header is not multipart/form-data", async () => {
    const stream = createMultipartFormDataStream(createMultipartFieldChunk("test-name", "test-value"));

    try {
      await bussinboy({ headers: { "content-type": "application/json" } }, stream);

      assert.fail("should have thrown");
    } catch (error) {
      assert.strictEqual(error.message, "Content-Type header is not set to multipart/form-data");
    }
  });

  it("should throw an error if boundary is missing", async () => {
    const stream = createMultipartFormDataStream(createMultipartFieldChunk("test-name", "test-value"));

    try {
      await bussinboy({ headers: { "content-type": "multipart/form-data" } }, stream);

      assert.fail("should have thrown");
    } catch (error) {
      assert.strictEqual(error.message, "Multipart: Boundary not found");
    }
  });

  it("should throw an error if boundary is malformed", async () => {
    const stream = createMultipartFormDataStream(createMultipartFieldChunk("test-name", "test-value"));

    try {
      await bussinboy({ headers: { "content-type": "multipart/form-data; boundary=malformed" } }, stream);

      assert.fail("should have thrown");
    } catch (error) {
      assert.strictEqual(error.message, "Unexpected end of multipart data");
    }
  });

  it("should throw an error if field name is missing", async () => {
    const stream = createMultipartFormDataStream(
      `--${boundary}\r\nContent-Disposition: form-data\r\n\r\ntest-value\r\n--${boundary}--`,
    );

    try {
      await bussinboy({ headers }, stream);

      assert.fail("should have thrown");
    } catch (error) {
      assert.strictEqual(error.message, "Field name is missing");
    }
  });

  it("should ignore data if Content-Disposition header is missing", async () => {
    const stream = createMultipartFormDataStream(
      `--${boundary}\r\nname="test-name"\r\n\r\ntest-value\r\n--${boundary}--`,
    );

    const data = await bussinboy({ headers }, stream);

    assert.deepEqual(data, {
      fields: [],
      files: [],
    });
  });

  it("should throw an error if field value is missing", async () => {
    const stream = createMultipartFormDataStream(
      `--${boundary}\r\nContent-Disposition: form-data; name=\"test-name\"\r\n\r\n--${boundary}--`,
    );

    try {
      await bussinboy({ headers }, stream);

      assert.fail("should have thrown");
    } catch (error) {
      assert.strictEqual(error.message, "Form data could not be processed");
    }
  });

  it("should throw an error if body is too large", async () => {
    const fieldName = "test-name";
    const fileName = "test-file-name";
    const fileContent = "test-file-content";
    const stream1 = createMultipartFormDataStream(createMultipartFileChunk(fieldName, fileName, fileContent));
    const bodySize = 186;

    const data1 = await bussinboy(
      {
        limits: {
          bodySize: bodySize,
        },
        headers,
      },
      stream1,
    );

    assert.deepEqual(data1, {
      fields: [],
      files: [
        {
          fieldName,
          fileName,
          encoding: "7bit",
          mimeType: "application/octet-stream",
          buffer: Buffer.from(fileContent),
        },
      ],
    });

    const stream2 = createMultipartFormDataStream(createMultipartFileChunk(fieldName, fileName, fileContent));

    try {
      await bussinboy({ headers, limits: { bodySize: bodySize - 1 } }, stream2);

      assert.fail("should have thrown");
    } catch (error) {
      assert.strictEqual(error.message, "Content too large");
    }
  });
});
