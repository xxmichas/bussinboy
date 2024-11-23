# @xxmichas/bussinboy

## 2.1.2

### Patch Changes

- 23f8059: added more tests

## 2.1.1

### Patch Changes

- 99292e1: bump deps
  bump node to v20

## 2.1.0

### Minor Changes

- 3d3b7f7: Added bodySize limit
  Added suggestedStatusCode to BussinboyEndUserError

## 2.0.0

### Major Changes

- a7a4951: Replaced http2 support with http1

## 1.4.0

### Minor Changes

- ec6d32e: Updated dependencies

## 1.3.0

### Minor Changes

- 4045c5b: omit empty files

## 1.2.0

### Minor Changes

- ffd21da: Don't allow fields without a name [RFC 7578 Section 4.2](https://datatracker.ietf.org/doc/html/rfc7578#section-4.2)

  Fixed an issue where [@fastify/busboy](https://github.com/fastify/busboy) becomes unresponsive when processing a field without a value

  Renamed BussinboyLimitError to BussinboyEndUserError and added new error code: fieldNameMissing

  improved typings

  added more tests

## 1.1.0

### Minor Changes

- 4695de0: fixed typo: "totalFileSize" -> "totalFilesSize"
  added limits and custom error messages tests

## 1.0.2

### Patch Changes

- 929f697: Fixed a race condition between Promise.then and EventEmitter.emit when processing files

## 1.0.1

### Patch Changes

- b07ba9c: init
