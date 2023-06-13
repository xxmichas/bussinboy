import Busboy from "@fastify/busboy";
import {
  BussinboyConfig,
  BussinboyData,
  BussinboyEndUserError,
  BussinboyErrorMessages,
  BussinboyField,
  BussinboyFile,
  BussinboyLimits,
} from "./utils";
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
      totalFilesSize: config.limits?.totalFilesSize ?? Infinity,
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
      totalFilesSizeLimit: config.errorMessages?.totalFilesSizeLimit ?? "Total file size limit reached",
    } satisfies BussinboyErrorMessages;

    const files: BussinboyFile[] = [];
    const fields: BussinboyField[] = [];

    let currentTotalFieldNamesSize = 0;
    let currentTotalFieldsSize = 0;
    let currentTotalFilesSize = 0;

    const updateCurrentTotalFieldNamesSize = (size: number) => {
      currentTotalFieldNamesSize += size;
      if (currentTotalFieldNamesSize > limits.totalFieldNamesSize) {
        handleError(new BussinboyEndUserError(errorMessages.totalFieldNamesSizeLimit, "totalFieldNamesSizeLimit"));
      }
    };
    const updateCurrentTotalFieldsSize = (size: number) => {
      currentTotalFieldsSize += size;
      if (currentTotalFieldsSize > limits.totalFieldsSize) {
        handleError(new BussinboyEndUserError(errorMessages.totalFieldsSizeLimit, "totalFieldsSizeLimit"));
      }
    };
    const updateCurrentTotalFilesSize = (size: number) => {
      currentTotalFilesSize += size;
      if (currentTotalFilesSize > limits.totalFilesSize) {
        handleError(new BussinboyEndUserError(errorMessages.totalFilesSizeLimit, "totalFilesSizeLimit"));
      }
    };

    const bus = new Busboy(config);

    const handleError = (error: Error) => {
      stream.unpipe(bus);
      bus.destroy();

      reject(error);
    };

    stream.on("end", () => {
      // reject promise on the next tick in case busboy
      // wasn't able to process the form data and got stuck
      // e.g. --boundary\r\nContent-Disposition: form-data; name=\"name\"\r\n\r\n--boundary--
      // https://nodejs.org/docs/latest-v18.x/api/stream.html#event-end
      setImmediate(() => {
        handleError(new Error("Form data could not be processed"));
      });
    });

    bus.on("error", (error: Error) => {
      handleError(error);
    });

    // fieldNameTruncated doesn't work in current version of @fastify/busboy
    bus.on("field", (name: string | undefined, value, _fieldNameTruncated, valueTruncated, encoding, mimeType) => {
      if (name === undefined) {
        // name can be undefined which violates RFC 7578 Section 4.2
        handleError(new BussinboyEndUserError("Field name is missing", "fieldNameMissing"));
        return;
      }

      const fieldNameByteLength = Buffer.byteLength(name, "utf8");

      if (fieldNameByteLength > limits.fieldNameSize) {
        handleError(new BussinboyEndUserError(errorMessages.fieldNameSizeLimit, "fieldNameSizeLimit"));
        return;
      } else if (valueTruncated) {
        handleError(new BussinboyEndUserError(errorMessages.fieldSizeLimit, "fieldSizeLimit"));
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

    bus.on("file", (fieldName: string | undefined, fileStream, fileName: string | undefined, encoding, mimeType) => {
      if (fieldName === undefined) {
        // name can be undefined which violates RFC 7578 Section 4.2
        handleError(new BussinboyEndUserError("Field name is missing", "fieldNameMissing"));
        return;
      }

      const data: Buffer[] = [];
      let limitReached = false;

      fileStream.on("data", (chunk: Buffer) => {
        updateCurrentTotalFilesSize(chunk.length);

        data.push(chunk);
      });

      fileStream.on("end", () => {
        if (limitReached) {
          // handleError was already called in "limit" event
          return;
        }

        files.push({
          fieldName,
          fileName,
          encoding: encoding,
          mimeType: mimeType,
          buffer: Buffer.concat(data),
        });
      });

      fileStream.on("limit", () => {
        // busboy won't read the rest of the fileStream
        // no further "data" events will be emitted
        limitReached = true;

        handleError(new BussinboyEndUserError(errorMessages.fileSizeLimit, "fileSizeLimit"));
      });

      fileStream.on("error", (err) => handleError(err));
    });

    bus.on("finish", () => resolve({ fields, files }));

    bus.on("fieldsLimit", () => handleError(new BussinboyEndUserError(errorMessages.fieldsLimit, "fieldsLimit")));

    bus.on("filesLimit", () => handleError(new BussinboyEndUserError(errorMessages.filesLimit, "filesLimit")));

    bus.on("partsLimit", () => handleError(new BussinboyEndUserError(errorMessages.partsLimit, "partsLimit")));

    stream.pipe(bus);
  });

export default bussinboy;
