// @ts-check
import { Readable } from "node:stream";

export const boundary = "TestFormBoundary2137";

export const headers = {
  "content-type": `multipart/form-data; boundary=${boundary}`,
};

/**
 * @param {string} name
 * @param {string} value
 */
export const createMultipartFieldChunk = (name, value) =>
  [`--${boundary}`, `Content-Disposition: form-data; name="${name}"`, "", value].join("\r\n");

/**
 * @param {string} name
 * @param {string} fileName
 * @param {string | Buffer} value
 * @param {string} mimeType
 * @returns
 */
export const createMultipartFileChunk = (name, fileName, value, mimeType = "application/octet-stream") =>
  [
    `--${boundary}`,
    `Content-Disposition: form-data; name="${name}"; filename="${fileName}"`,
    `Content-Type: ${mimeType}`,
    "",
    value,
  ].join("\r\n");

/**
 * @param  {...string} chunks
 * @returns {import("http").IncomingMessage}
 */
export const createMultipartFormDataStream = (...chunks) =>
  // @ts-ignore
  Readable.from(chunks.join("\r\n") + "\r\n" + `--${boundary}--`);
