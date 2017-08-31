import 'reflect-metadata';

export type Meta = { [key: string]: any };

export function defineMeta<M extends Meta = Meta>(
  meta: M, symbol: Symbol, target: any
): void {
  if (typeof symbol !== 'symbol' || typeof meta !== 'object') throw new TypeError();
  if (isClass(target)) Reflect.defineMetadata(symbol, meta, target.prototype);
  else Reflect.defineMetadata(symbol, meta, target);
}

export function defineMetaKey<M extends Meta = Meta>(
  meta: M, symbol: Symbol, target: any, key: string
): void {
  if (typeof symbol !== 'symbol' || typeof meta !== 'object') throw new TypeError();
  const map = mapMeta<M>(symbol, target) || new Map();
  if (!(map instanceof Map) || map.has(key)) throw new ReferenceError();
  map.set(key, meta);
  if (isClass(target)) Reflect.defineMetadata(symbol, map, target.prototype);
  else Reflect.defineMetadata(symbol, map, target);
}

export function mapMeta<M extends Meta = Meta>(
  symbol: Symbol, target: any
): Map<string, M> {
  if (isClass(target)) return Reflect.getMetadata(symbol, target.prototype);
  else return Reflect.getMetadata(symbol, target);
}

export function getMeta<M extends Meta = Meta>(
  symbol: Symbol, target: any
): M {
  if (isClass(target)) return Reflect.getMetadata(symbol, target.prototype);
  else return Reflect.getMetadata(symbol, target);
}

function isClass(fn) {
  const toString = Function.prototype.toString;

  function fnBody(fn) {
    return toString.call(fn).replace(/^[^{]*{\s*/,'').replace(/\s*}[^}]*$/,'');
  }

  return typeof fn === 'function' && (
    /^class\s/.test(toString.call(fn)) ||
    /^.*classCallCheck\(/.test(fnBody(fn))
  );
}
