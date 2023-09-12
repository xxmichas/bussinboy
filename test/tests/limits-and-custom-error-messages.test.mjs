// @ts-check
import assert from "assert/strict";
import { describe, it } from "node:test";
import { bussinboy } from "../../dist/index.js";
import {
  headers,
  createMultipartFieldChunk,
  createMultipartFileChunk,
  createMultipartFormDataStream,
} from "../utils.mjs";

describe("limits and custom error messages", () => {
  describe("fieldNameSize", () => {
    const fieldName = "test-name";
    const fieldNameByteLength = Buffer.byteLength(fieldName);

    it("shouldn't throw if field name is within the limit", async () => {
      const stream = createMultipartFormDataStream(createMultipartFieldChunk(fieldName, "test-value"));

      const data = await bussinboy(
        {
          limits: {
            fieldNameSize: fieldNameByteLength,
          },
          headers,
        },
        stream,
      );

      assert.deepEqual(data, {
        fields: [
          {
            encoding: "7bit",
            mimeType: "text/plain",
            name: fieldName,
            value: "test-value",
          },
        ],
        files: [],
      });
    });

    it("should throw if field name is over the limit", async () => {
      const stream = createMultipartFormDataStream(createMultipartFieldChunk(fieldName, "test-value"));

      try {
        await bussinboy(
          {
            limits: {
              fieldNameSize: fieldNameByteLength - 1,
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "Field name size limit reached");
        assert.strictEqual(error.code, "fieldNameSizeLimit");
      }
    });

    it("should throw if field name is over the limit (custom error message)", async () => {
      const stream = createMultipartFormDataStream(createMultipartFieldChunk(fieldName, "test-value"));

      try {
        await bussinboy(
          {
            limits: {
              fieldNameSize: fieldNameByteLength - 1,
            },
            errorMessages: {
              fieldNameSizeLimit: "CUSTOM: fieldNameSizeLimit",
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "CUSTOM: fieldNameSizeLimit");
        assert.strictEqual(error.code, "fieldNameSizeLimit");
      }
    });
  });

  describe("fieldSize", () => {
    const fieldName = "test-name";
    const fieldValue = "test-value";
    const fieldValueByteLength = Buffer.byteLength(fieldValue);

    it("shouldn't throw if field value is within the limit", async () => {
      const stream = createMultipartFormDataStream(createMultipartFieldChunk(fieldName, fieldValue));

      const data = await bussinboy(
        {
          limits: {
            fieldSize: fieldValueByteLength,
          },
          headers,
        },
        stream,
      );

      assert.deepEqual(data, {
        fields: [
          {
            encoding: "7bit",
            mimeType: "text/plain",
            name: fieldName,
            value: fieldValue,
          },
        ],
        files: [],
      });
    });

    it("should throw if field value is over the limit", async () => {
      const stream = createMultipartFormDataStream(createMultipartFieldChunk(fieldName, fieldValue));

      try {
        await bussinboy(
          {
            limits: {
              fieldSize: fieldValueByteLength - 1,
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "Field value size limit reached");
        assert.strictEqual(error.code, "fieldSizeLimit");
      }
    });

    it("should throw if field value is over the limit (custom error message)", async () => {
      const stream = createMultipartFormDataStream(createMultipartFieldChunk(fieldName, fieldValue));

      try {
        await bussinboy(
          {
            limits: {
              fieldSize: fieldValueByteLength - 1,
            },
            errorMessages: {
              fieldSizeLimit: "CUSTOM: fieldSizeLimit",
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "CUSTOM: fieldSizeLimit");
        assert.strictEqual(error.code, "fieldSizeLimit");
      }
    });
  });

  describe("fields", () => {
    const fieldName = "test-name";
    const fieldValue = "test-value";

    it("shouldn't throw if field count is within the limit", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFieldChunk(fieldName, fieldValue),
        createMultipartFieldChunk(fieldName, fieldValue),
      );

      const data = await bussinboy(
        {
          limits: {
            fields: 2,
          },
          headers,
        },
        stream,
      );

      assert.deepEqual(data, {
        fields: [
          {
            encoding: "7bit",
            mimeType: "text/plain",
            name: fieldName,
            value: fieldValue,
          },
          {
            encoding: "7bit",
            mimeType: "text/plain",
            name: fieldName,
            value: fieldValue,
          },
        ],
        files: [],
      });
    });

    it("should throw if field count is over the limit", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFieldChunk(fieldName, fieldValue),
        createMultipartFieldChunk(fieldName, fieldValue),
      );

      try {
        await bussinboy(
          {
            limits: {
              fields: 1,
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "Fields limit reached");
        assert.strictEqual(error.code, "fieldsLimit");
      }
    });

    it("should throw if field count is over the limit (custom error message)", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFieldChunk(fieldName, fieldValue),
        createMultipartFieldChunk(fieldName, fieldValue),
      );

      try {
        await bussinboy(
          {
            limits: {
              fields: 1,
            },
            errorMessages: {
              fieldsLimit: "CUSTOM: fieldsLimit",
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "CUSTOM: fieldsLimit");
        assert.strictEqual(error.code, "fieldsLimit");
      }
    });
  });

  describe("fileSize", () => {
    const fieldName = "test-name";
    const fileName = "test-file-name";
    const fileContent = "test-file-content";
    const fileContentByteLength = Buffer.byteLength(fileContent);

    it("shouldn't throw if file size is within the limit", async () => {
      const stream = createMultipartFormDataStream(createMultipartFileChunk(fieldName, fileName, fileContent));

      const data = await bussinboy(
        {
          limits: {
            fileSize: fileContentByteLength,
          },
          headers,
        },
        stream,
      );

      assert.deepEqual(data, {
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
    });

    it("should throw if file size is over the limit", async () => {
      const stream = createMultipartFormDataStream(createMultipartFileChunk(fieldName, fileName, fileContent));

      try {
        await bussinboy(
          {
            limits: {
              fileSize: fileContentByteLength - 1,
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "File size limit reached");
        assert.strictEqual(error.code, "fileSizeLimit");
      }
    });

    it("should throw if file size is over the limit (custom error message)", async () => {
      const stream = createMultipartFormDataStream(createMultipartFileChunk(fieldName, fileName, fileContent));

      try {
        await bussinboy(
          {
            limits: {
              fileSize: fileContentByteLength - 1,
            },
            errorMessages: {
              fileSizeLimit: "CUSTOM: fileSizeLimit",
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "CUSTOM: fileSizeLimit");
        assert.strictEqual(error.code, "fileSizeLimit");
      }
    });
  });

  describe("files", () => {
    const fieldName = "test-name";
    const fileName = "test-file-name";
    const fileContent = "test-file-content";

    it("should omit empty files", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFileChunk(fieldName, fileName, ""),
        createMultipartFileChunk(fieldName, fileName, fileContent),
      );

      const data = await bussinboy(
        {
          limits: {
            files: 2,
          },
          headers,
        },
        stream,
      );

      assert.deepEqual(data, {
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
    });

    it("shouldn't throw if file count is within the limit", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFileChunk(fieldName, fileName, fileContent),
        createMultipartFileChunk(fieldName, fileName, fileContent),
      );

      const data = await bussinboy(
        {
          limits: {
            files: 2,
          },
          headers,
        },
        stream,
      );

      assert.deepEqual(data, {
        fields: [],
        files: [
          {
            fieldName,
            fileName,
            encoding: "7bit",
            mimeType: "application/octet-stream",
            buffer: Buffer.from(fileContent),
          },
          {
            fieldName,
            fileName,
            encoding: "7bit",
            mimeType: "application/octet-stream",
            buffer: Buffer.from(fileContent),
          },
        ],
      });
    });

    it("should throw if file count is over the limit", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFileChunk(fieldName, fileName, fileContent),
        createMultipartFileChunk(fieldName, fileName, fileContent),
      );

      try {
        await bussinboy(
          {
            limits: {
              files: 1,
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "Files limit reached");
        assert.strictEqual(error.code, "filesLimit");
      }
    });

    it("should throw if file count is over the limit (custom error message)", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFileChunk(fieldName, fileName, fileContent),
        createMultipartFileChunk(fieldName, fileName, fileContent),
      );

      try {
        await bussinboy(
          {
            limits: {
              files: 1,
            },
            errorMessages: {
              filesLimit: "CUSTOM: filesLimit",
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "CUSTOM: filesLimit");
        assert.strictEqual(error.code, "filesLimit");
      }
    });
  });

  describe("parts", () => {
    const fieldName = "test-name";
    const fieldValue = "test-value";
    const fileName = "test-file-name";
    const fileContent = "test-file-content";

    it("shouldn't throw if part count is within the limit", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFieldChunk(fieldName, fieldValue),
        createMultipartFileChunk(fieldName, fileName, fileContent),
      );

      const data = await bussinboy(
        {
          limits: {
            parts: 2,
          },
          headers,
        },
        stream,
      );

      assert.deepEqual(data, {
        fields: [
          {
            encoding: "7bit",
            mimeType: "text/plain",
            name: fieldName,
            value: fieldValue,
          },
        ],
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
    });

    it("should throw if part count is over the limit", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFieldChunk(fieldName, fieldValue),
        createMultipartFileChunk(fieldName, fileName, fileContent),
      );

      try {
        await bussinboy(
          {
            limits: {
              parts: 1,
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "Parts limit reached");
        assert.strictEqual(error.code, "partsLimit");
      }
    });

    it("should throw if part count is over the limit (custom error message)", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFieldChunk(fieldName, fieldValue),
        createMultipartFileChunk(fieldName, fileName, fileContent),
      );

      try {
        await bussinboy(
          {
            limits: {
              parts: 1,
            },
            errorMessages: {
              partsLimit: "CUSTOM: partsLimit",
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "CUSTOM: partsLimit");
        assert.strictEqual(error.code, "partsLimit");
      }
    });
  });

  describe("totalFieldNamesSize", () => {
    const fieldName = "test-name";
    const fieldValue = "test-value";
    const fieldNameByteLength = Buffer.byteLength(fieldName);

    it("shouldn't throw if total size of all field names is within the limit", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFieldChunk(fieldName, fieldValue),
        createMultipartFieldChunk(fieldName, fieldValue),
      );

      const data = await bussinboy(
        {
          limits: {
            totalFieldNamesSize: fieldNameByteLength * 2,
          },
          headers,
        },
        stream,
      );

      assert.deepEqual(data, {
        fields: [
          {
            encoding: "7bit",
            mimeType: "text/plain",
            name: fieldName,
            value: fieldValue,
          },
          {
            encoding: "7bit",
            mimeType: "text/plain",
            name: fieldName,
            value: fieldValue,
          },
        ],
        files: [],
      });
    });

    it("should throw if total size of all field names is over the limit", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFieldChunk(fieldName, fieldValue),
        createMultipartFieldChunk(fieldName, fieldValue),
      );

      try {
        await bussinboy(
          {
            limits: {
              totalFieldNamesSize: fieldNameByteLength * 2 - 1,
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "Total field names size limit reached");
        assert.strictEqual(error.code, "totalFieldNamesSizeLimit");
      }
    });

    it("should throw if total size of all field names is over the limit (custom error message)", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFieldChunk(fieldName, fieldValue),
        createMultipartFieldChunk(fieldName, fieldValue),
      );

      try {
        await bussinboy(
          {
            limits: {
              totalFieldNamesSize: fieldNameByteLength * 2 - 1,
            },
            errorMessages: {
              totalFieldNamesSizeLimit: "CUSTOM: totalFieldNamesSizeLimit",
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "CUSTOM: totalFieldNamesSizeLimit");
        assert.strictEqual(error.code, "totalFieldNamesSizeLimit");
      }
    });
  });

  describe("totalFieldsSize", () => {
    const fieldName = "test-name";
    const fieldValue = "test-value";
    const fieldValueByteLength = Buffer.byteLength(fieldValue);

    it("shouldn't throw if total size of all fields is within the limit", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFieldChunk(fieldName, fieldValue),
        createMultipartFieldChunk(fieldName, fieldValue),
      );

      const data = await bussinboy(
        {
          limits: {
            totalFieldsSize: fieldValueByteLength * 2,
          },
          headers,
        },
        stream,
      );

      assert.deepEqual(data, {
        fields: [
          {
            encoding: "7bit",
            mimeType: "text/plain",
            name: fieldName,
            value: fieldValue,
          },
          {
            encoding: "7bit",
            mimeType: "text/plain",
            name: fieldName,
            value: fieldValue,
          },
        ],
        files: [],
      });
    });

    it("should throw if total size of all fields is over the limit", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFieldChunk(fieldName, fieldValue),
        createMultipartFieldChunk(fieldName, fieldValue),
      );

      try {
        await bussinboy(
          {
            limits: {
              totalFieldsSize: fieldValueByteLength * 2 - 1,
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "Total fields size limit reached");
        assert.strictEqual(error.code, "totalFieldsSizeLimit");
      }
    });

    it("should throw if total size of all fields is over the limit (custom error message)", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFieldChunk(fieldName, fieldValue),
        createMultipartFieldChunk(fieldName, fieldValue),
      );

      try {
        await bussinboy(
          {
            limits: {
              totalFieldsSize: fieldValueByteLength * 2 - 1,
            },
            errorMessages: {
              totalFieldsSizeLimit: "CUSTOM: totalFieldsSizeLimit",
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "CUSTOM: totalFieldsSizeLimit");
        assert.strictEqual(error.code, "totalFieldsSizeLimit");
      }
    });
  });

  describe("totalFilesSize", () => {
    const fieldName = "test-name";
    const fileName = "test-file-name";
    const fileContent = "test-file-content";
    const fileContentByteLength = Buffer.byteLength(fileContent);

    it("shouldn't throw if total size of all files is within the limit", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFileChunk(fieldName, fileName, fileContent),
        createMultipartFileChunk(fieldName, fileName, fileContent),
      );

      const data = await bussinboy(
        {
          limits: {
            totalFilesSize: fileContentByteLength * 2,
          },
          headers,
        },
        stream,
      );

      assert.deepEqual(data, {
        fields: [],
        files: [
          {
            fieldName,
            fileName,
            encoding: "7bit",
            mimeType: "application/octet-stream",
            buffer: Buffer.from(fileContent),
          },
          {
            fieldName,
            fileName,
            encoding: "7bit",
            mimeType: "application/octet-stream",
            buffer: Buffer.from(fileContent),
          },
        ],
      });
    });

    it("should throw if total size of all files is over the limit", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFileChunk(fieldName, fileName, fileContent),
        createMultipartFileChunk(fieldName, fileName, fileContent),
      );

      try {
        await bussinboy(
          {
            limits: {
              totalFilesSize: fileContentByteLength * 2 - 1,
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "Total file size limit reached");
        assert.strictEqual(error.code, "totalFilesSizeLimit");
      }
    });

    it("should throw if total size of all files is over the limit (custom error message)", async () => {
      const stream = createMultipartFormDataStream(
        createMultipartFileChunk(fieldName, fileName, fileContent),
        createMultipartFileChunk(fieldName, fileName, fileContent),
      );

      try {
        await bussinboy(
          {
            limits: {
              totalFilesSize: fileContentByteLength * 2 - 1,
            },
            errorMessages: {
              totalFilesSizeLimit: "CUSTOM: totalFilesSizeLimit",
            },
            headers,
          },
          stream,
        );

        assert.fail("should have thrown");
      } catch (error) {
        assert.strictEqual(error.message, "CUSTOM: totalFilesSizeLimit");
        assert.strictEqual(error.code, "totalFilesSizeLimit");
      }
    });
  });
});
