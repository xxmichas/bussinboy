---
"@xxmichas/bussinboy": minor
---

Don't allow fields without a name [RFC 7578 Section 4.2](https://datatracker.ietf.org/doc/html/rfc7578#section-4.2)

Fixed an issue where [@fastify/busboy](https://github.com/fastify/busboy) becomes unresponsive when processing a field without a value

Renamed BussinboyLimitError to BussinboyEndUserError and added new error code: fieldNameMissing

improved typings

added more tests
