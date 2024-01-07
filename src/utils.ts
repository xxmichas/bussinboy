import { BusboyConfig } from "@fastify/busboy";
import http2 from "http2";

export type BussinboyConfig = Omit<BusboyConfig, "headers"> & {
  headers: http2.IncomingHttpHeaders;
  /**
   * Various limits on incoming data.
   */
  limits?: BussinboyLimits;
  /**
   * Custom error messages for limits.
   */
  errorMessages?: BussinboyErrorMessages;
};

export type BussinboyLimits = BusboyConfig["limits"] & {
  /**
   * Maximum number of bytes to process before rejecting the promise.
   *
   * Content-Length header cannot be trusted, so when this limit is provided all read bytes are counted.
   */
  bodySize?: number;
  /**
   * Total max size of all field names (in bytes).
   *
   * **fieldNameSize** limit still applies to individual fields.
   *
   * @default Infinity
   */
  totalFieldNamesSize?: number | undefined;

  /**
   * Total max size of all field values (in bytes).
   *
   * **fieldSize** limit still applies to individual fields.
   *
   * @default Infinity
   */
  totalFieldsSize?: number | undefined;

  /**
   * Total max size of all files (in bytes).
   *
   * **fileSize** limit still applies to individual files.
   *
   * @default Infinity
   */
  totalFilesSize?: number | undefined;
};

export type BussinboyErrorMessages = {
  [key in BussinboyLimitCode]?: string | undefined;
};

export type BussinboyField = {
  name: string;
  value: string;
  encoding: string;
  mimeType: string;
};

export type BussinboyFile = {
  buffer: Buffer;
  fieldName: string;
  /**
   * **WARNING**: You should almost never use this value as-is
   * (especially if you are using preservePath: true in your config)
   * as it could contain malicious input. You are better off generating your own (safe) filenames,
   * or at the very least using a hash of the filename.
   */
  fileName: string | undefined;
  encoding: string;
  mimeType: string;
};

export type BussinboyData = {
  fields: BussinboyField[];
  files: BussinboyFile[];
};

type BussinboyLimitCode =
  | "bodySizeLimit"
  | "fieldNameSizeLimit"
  | "fieldSizeLimit"
  | "fieldsLimit"
  | "fileSizeLimit"
  | "filesLimit"
  | "partsLimit"
  | "totalFieldNamesSizeLimit"
  | "totalFieldsSizeLimit"
  | "totalFilesSizeLimit";

type BussinboyFormDataErrorCode = "fieldNameMissing";

export type BussinboyErrorCode = BussinboyLimitCode | BussinboyFormDataErrorCode;

/**
 * This error's message is safe to show to the end user.
 */
export class BussinboyEndUserError extends Error {
  public code: BussinboyErrorCode;
  public suggestedStatusCode: number;

  constructor(message: string, code: BussinboyErrorCode, suggestedStatusCode: number) {
    super(message);
    this.code = code;
    this.suggestedStatusCode = suggestedStatusCode;
  }
}
