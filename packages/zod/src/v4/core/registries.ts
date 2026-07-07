import type * as core from "./core.js";
import type { $ZodType } from "./schemas.js";

export const $output: unique symbol = Symbol("ZodOutput");
export type $output = typeof $output;
export const $input: unique symbol = Symbol("ZodInput");
export type $input = typeof $input;

export type $replace<Meta, S extends $ZodType> = Meta extends $output
  ? core.output<S>
  : Meta extends $input
    ? core.input<S>
    : Meta extends (infer M)[]
      ? $replace<M, S>[]
      : Meta extends (...args: infer P) => infer R
        ? (
            ...args: {
              [K in keyof P]: $replace<P[K], S>; // tuple
            }
          ) => $replace<R, S>
        : // handle objects
          Meta extends object
          ? { [K in keyof Meta]: $replace<Meta[K], S> }
          : Meta;

type MetadataType = object | undefined;
const CACHE_EMPTY = Symbol("ZodRegistryCacheEmpty");
export class $ZodRegistry<Meta extends MetadataType = MetadataType, Schema extends $ZodType = $ZodType> {
  _meta!: Meta;
  _schema!: Schema;
  _map: WeakMap<Schema, $replace<Meta, Schema>> = new WeakMap();
  _idmap: Map<string, Schema> = new Map();
  _cache: WeakMap<Schema, $replace<Meta, Schema> | typeof CACHE_EMPTY> = new WeakMap();

  add<S extends Schema>(
    schema: S,
    ..._meta: undefined extends Meta ? [$replace<Meta, S>?] : [$replace<Meta, S>]
  ): this {
    const meta: any = _meta[0];
    this._map.set(schema, meta!);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.set(meta.id!, schema);
    }
    this._cache = new WeakMap();
    return this as any;
  }

  clear(): this {
    this._map = new WeakMap();
    this._idmap = new Map();
    this._cache = new WeakMap();
    return this;
  }

  remove(schema: Schema): this {
    const meta: any = this._map.get(schema);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.delete(meta.id!);
    }
    this._map.delete(schema);
    this._cache = new WeakMap();
    return this;
  }

  get<S extends Schema>(schema: S): $replace<Meta, S> | undefined {
    // return this._map.get(schema) as any;

    const cached = this._cache.get(schema);
    if (cached !== undefined) {
      return cached === CACHE_EMPTY ? undefined : (cached as any);
    }

    // inherit metadata
    const p = schema._zod.parent as Schema;
    if (p) {
      const pm: any = { ...(this.get(p) ?? {}) };
      delete pm.id; // do not inherit id
      const f = { ...pm, ...this._map.get(schema) } as any;
      const result = Object.keys(f).length ? f : undefined;
      this._cache.set(schema, result === undefined ? CACHE_EMPTY : result);
      return result;
    }
    const result = this._map.get(schema) as any;
    this._cache.set(schema, result === undefined ? CACHE_EMPTY : result);
    return result;
  }

  has(schema: Schema): boolean {
    return this._map.has(schema);
  }
}

export interface JSONSchemaMeta {
  id?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  deprecated?: boolean | undefined;
  [k: string]: unknown;
}

export interface GlobalMeta extends JSONSchemaMeta {}

// registries
export function registry<T extends MetadataType = MetadataType, S extends $ZodType = $ZodType>(): $ZodRegistry<T, S> {
  return new $ZodRegistry<T, S>();
}

interface GlobalThisWithRegistry {
  /**
   * The globalRegistry instance shared across both CommonJS and ESM builds.
   * By attaching the registry to `globalThis`, this property ensures a single, deduplicated instance
   * is used regardless of whether the package is loaded via `require` (CJS) or `import` (ESM).
   * This prevents dual package hazards and keeps registry state consistent.
   */
  __zod_globalRegistry?: $ZodRegistry<GlobalMeta>;
}

(globalThis as GlobalThisWithRegistry).__zod_globalRegistry ??= registry<GlobalMeta>();
export const globalRegistry: $ZodRegistry<GlobalMeta> = (globalThis as GlobalThisWithRegistry).__zod_globalRegistry!;
