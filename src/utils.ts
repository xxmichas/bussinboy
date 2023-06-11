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
  totalFileSize?: number | undefined;
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
  fieldName: string | undefined;
  fileName: string;
  encoding: string;
  mimeType: string;
};

export type BussinboyData = {
  fields: BussinboyField[];
  files: BussinboyFile[];
};

export type BussinboyLimitCode =
  | "fieldNameSizeLimit"
  | "fieldSizeLimit"
  | "fieldsLimit"
  | "fileSizeLimit"
  | "filesLimit"
  | "partsLimit"
  | "totalFieldNamesSizeLimit"
  | "totalFieldsSizeLimit"
  | "totalFileSizeLimit";

export class BussinboyLimitError extends Error {
  public code: BussinboyLimitCode;

  constructor(message: string, code: BussinboyLimitCode) {
    super(message);
    this.code = code;
  }
}
