export * as core from "../core/index.js";
export * from "./parse.js";
export * from "./schemas.js";
export * from "./checks.js";

export type { JSONType } from "../core/util.js";

import type { $ZodType } from "../core/index.js";

export type infer<T extends $ZodType> = T["_zod"]["output"];
export type input<T extends $ZodType> = T["_zod"]["input"];
export type output<T extends $ZodType> = T["_zod"]["output"];
export {
  globalRegistry,
  registry,
  config,
  $output,
  $input,
  $brand,
  clone,
  regexes,
  treeifyError,
  prettifyError,
  formatError,
  flattenError,
  TimePrecision,
  util,
  NEVER,
} from "../core/index.js";
export { toJSONSchema } from "../core/json-schema-processors.js";

export * as locales from "../locales/index.js";
/** A special constant with type `never` */
// export const NEVER = {} as never;

// iso
export * as iso from "./iso.js";
export {
  ZodMiniISODateTime,
  ZodMiniISODate,
  ZodMiniISOTime,
  ZodMiniISODuration,
} from "./iso.js";

// coerce
export * as coerce from "./coerce.js";
