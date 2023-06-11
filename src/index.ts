import Busboy, { BusboyConfig } from "@fastify/busboy";
import {
  BussinboyConfig,
  BussinboyData,
  BussinboyErrorMessages,
  BussinboyField,
  BussinboyFile,
  BussinboyLimitError,
  BussinboyLimits,
} from "./utils";
import { Readable } from "stream";
import http2 from "http2";

export * from "./utils";

const isContentTypeHeaderCorrect = (
  config: BussinboyConfig,
): config is BussinboyConfig & {
  headers: http2.IncomingHttpHeaders & {
    "content-type": string;
  };
} => {
  return config.headers["content-type"]?.startsWith("multipart/form-data") === true;
};

export const bussinboy = async (config: BussinboyConfig, stream: http2.ServerHttp2Stream) =>
  new Promise<BussinboyData>((resolve, reject) => {
    if (!isContentTypeHeaderCorrect(config)) {
      reject(new TypeError("Content-Type header is not set to multipart/form-data"));
      return;
    }

    // Set default limits
    const limits = {
      fieldNameSize: config.limits?.fieldNameSize ?? 100,
      totalFieldNamesSize: config.limits?.totalFieldNamesSize ?? Infinity,
      totalFieldsSize: config.limits?.totalFieldsSize ?? Infinity,
      totalFileSize: config.limits?.totalFileSize ?? Infinity,
    } satisfies BussinboyLimits;

    // Set default error messages
    const errorMessages = {
      fieldNameSizeLimit: config.errorMessages?.fieldNameSizeLimit ?? "Field name size limit reached",
      fieldSizeLimit: config.errorMessages?.fieldSizeLimit ?? "Field value size limit reached",
      fieldsLimit: config.errorMessages?.fieldsLimit ?? "Fields limit reached",
      fileSizeLimit: config.errorMessages?.fileSizeLimit ?? "File size limit reached",
      filesLimit: config.errorMessages?.filesLimit ?? "Files limit reached",
      partsLimit: config.errorMessages?.partsLimit ?? "Parts limit reached",
      totalFieldNamesSizeLimit:
        config.errorMessages?.totalFieldNamesSizeLimit ?? "Total field names size limit reached",
      totalFieldsSizeLimit: config.errorMessages?.totalFieldsSizeLimit ?? "Total fields size limit reached",
      totalFileSizeLimit: config.errorMessages?.totalFileSizeLimit ?? "Total file size limit reached",
    } satisfies BussinboyErrorMessages;

    const files: BussinboyFile[] = [];
    const fields: BussinboyField[] = [];

    let currentTotalFieldNamesSize = 0;
    let currentTotalFieldsSize = 0;
    let currentTotalFileSize = 0;

    const updateCurrentTotalFieldNamesSize = (size: number) => {
      currentTotalFieldNamesSize += size;
      if (currentTotalFieldNamesSize > limits.totalFieldNamesSize) {
        handleError(new BussinboyLimitError(errorMessages.totalFieldNamesSizeLimit, "totalFieldNamesSizeLimit"));
      }
    };
    const updateCurrentTotalFieldsSize = (size: number) => {
      currentTotalFieldsSize += size;
      if (currentTotalFieldsSize > limits.totalFieldsSize) {
        handleError(new BussinboyLimitError(errorMessages.totalFieldsSizeLimit, "totalFieldsSizeLimit"));
      }
    };
    const updateCurrentTotalFileSize = (size: number) => {
      currentTotalFileSize += size;
      if (currentTotalFileSize > limits.totalFileSize) {
        handleError(new BussinboyLimitError(errorMessages.totalFileSizeLimit, "totalFileSizeLimit"));
      }
    };

    const bus = new Busboy(config);

    const handleError = (error: Error) => {
      stream.unpipe(bus);
      bus.destroy();

      reject(error);
    };

    bus.on("error", (error: Error) => {
      handleError(error);
    });

    // fieldNameTruncated doesn't work in current version of @fastify/busboy
    bus.on("field", (name, value, _fieldNameTruncated, valueTruncated, encoding, mimeType) => {
      const fieldNameByteLength = Buffer.byteLength(name, "utf8");

      if (fieldNameByteLength > limits.fieldNameSize) {
        handleError(new BussinboyLimitError(errorMessages.fieldNameSizeLimit, "fieldNameSizeLimit"));
        return;
      } else if (valueTruncated) {
        handleError(new BussinboyLimitError(errorMessages.fieldSizeLimit, "fieldSizeLimit"));
        return;
      }

      updateCurrentTotalFieldNamesSize(fieldNameByteLength);
      updateCurrentTotalFieldsSize(Buffer.byteLength(value, "utf8"));

      fields.push({
        name,
        value,
        encoding: encoding,
        mimeType: mimeType,
      });
    });

    bus.on("file", async (fieldName, stream, filename, encoding, mimeType) => {
      try {
        const buffer = await busboyStreamToBuffer(stream, updateCurrentTotalFileSize, errorMessages.fileSizeLimit);

        files.push({
          buffer,
          fieldName,
          fileName: filename,
          encoding: encoding,
          mimeType: mimeType,
        });
      } catch (error) {
        handleError(error as Error);
      }
    });

    bus.on("finish", () => resolve({ fields, files }));

    bus.on("fieldsLimit", () => handleError(new BussinboyLimitError(errorMessages.fieldsLimit, "fieldsLimit")));

    bus.on("filesLimit", () => handleError(new BussinboyLimitError(errorMessages.filesLimit, "filesLimit")));

    bus.on("partsLimit", () => handleError(new BussinboyLimitError(errorMessages.partsLimit, "partsLimit")));

    stream.pipe(bus);
  });

export default bussinboy;

const busboyStreamToBuffer = async (
  stream: Readable,
  updateCurrentTotalFileSize: (size: number) => void,
  fileSizeLimitErrorMessage: string,
): Promise<Buffer> =>
  new Promise<Buffer>((resolve, reject) => {
    const data: Buffer[] = [];
    let limitReached = false;

    stream.on("data", (chunk: Buffer) => {
      updateCurrentTotalFileSize(chunk.length);

      data.push(chunk);
    });

    stream.on("end", () => {
      if (limitReached) {
        return;
      }

      resolve(Buffer.concat(data));
    });

    stream.on("limit", () => {
      // busboy won't read the rest of the stream
      // no further "data" events will be emitted
      limitReached = true;

      reject(new BussinboyLimitError(fileSizeLimitErrorMessage, "fileSizeLimit"));
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
