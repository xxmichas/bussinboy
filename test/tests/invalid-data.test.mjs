// @ts-check
import assert from "assert/strict";
import { describe, it } from "node:test";
import { bussinboy } from "../../dist/index.js";
import { headers, createMultipartFieldChunk, createMultipartFormDataStream, boundary } from "../utils.mjs";

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
      console.log(error);
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
});
