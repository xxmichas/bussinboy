import Busboy from "@fastify/busboy";
import { BussinboyConfig, BussinboyField, BussinboyFile, BussinboyLimitError } from "./utils";
import { Readable } from "stream";
import http2 from "http2";

export * from "./utils";

export const bussinboy = async (config: BussinboyConfig, stream: http2.ServerHttp2Stream) =>
  new Promise<{ fields: BussinboyField[]; files: BussinboyFile[] }>(async (resolve, reject) => {
    // Set default limits
    const limits = config.limits ?? {};
    const fieldNameSize = limits.fieldNameSize ?? 100;
    const totalFieldNamesSize = limits.totalFieldNamesSize ?? Infinity;
    const totalFieldsSize = limits.totalFieldsSize ?? Infinity;
    const totalFileSize = limits.totalFileSize ?? Infinity;

    const files: BussinboyFile[] = [];
    const fields: BussinboyField[] = [];

    let currentTotalFieldNamesSize = 0;
    let currentTotalFieldsSize = 0;
    let currentTotalFileSize = 0;

    const updateCurrentTotalFieldNamesSize = (size: number) => {
      currentTotalFieldNamesSize += size;
      if (currentTotalFieldNamesSize > totalFieldNamesSize) {
        handleError(new BussinboyLimitError("Total field names size limit reached", "totalFieldNamesSizeLimit"));
      }
    };
    const updateCurrentTotalFieldsSize = (size: number) => {
      currentTotalFieldsSize += size;
      if (currentTotalFieldsSize > totalFieldsSize) {
        handleError(new BussinboyLimitError("Total fields size limit reached", "totalFieldsSizeLimit"));
      }
    };
    const updateCurrentTotalFileSize = (size: number) => {
      currentTotalFileSize += size;
      if (currentTotalFileSize > totalFileSize) {
        handleError(new BussinboyLimitError("Total file size limit reached", "totalFileSizeLimit"));
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

      if (fieldNameByteLength > fieldNameSize) {
        handleError(new BussinboyLimitError("Field name size limit reached", "fieldNameSizeLimit"));
        return;
      } else if (valueTruncated) {
        handleError(new BussinboyLimitError("Field value size limit reached", "fieldSizeLimit"));
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
        const buffer = await busboyStreamToBuffer(stream, updateCurrentTotalFileSize);

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

    bus.on("fieldsLimit", () => handleError(new BussinboyLimitError("Fields limit reached", "fieldsLimit")));

    bus.on("filesLimit", () => handleError(new BussinboyLimitError("Files limit reached", "filesLimit")));

    bus.on("partsLimit", () => handleError(new BussinboyLimitError("Parts limit reached", "partsLimit")));

    stream.pipe(bus);
  });

export default bussinboy;

const busboyStreamToBuffer = async (
  stream: Readable,
  updateCurrentTotalFileSize: (size: number) => void,
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

      reject(new BussinboyLimitError("File size limit reached", "fileSizeLimit"));
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
