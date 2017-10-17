"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
function defineMeta(meta, symbol, target) {
    if (typeof symbol !== 'symbol' || typeof meta !== 'object')
        throw new TypeError();
    if (isClass(target))
        Reflect.defineMetadata(symbol, meta, target.prototype);
    else
        Reflect.defineMetadata(symbol, meta, target);
}
exports.defineMeta = defineMeta;
function defineMetaKey(meta, symbol, target, key) {
    if (typeof symbol !== 'symbol' || typeof meta !== 'object')
        throw new TypeError();
    const map = mapMeta(symbol, target) || new Map();
    if (map.has(key))
        throw new ReferenceError(key);
    map.set(key, meta);
    if (isClass(target))
        Reflect.defineMetadata(symbol, map, target.prototype);
    else
        Reflect.defineMetadata(symbol, map, target);
}
exports.defineMetaKey = defineMetaKey;
function mapMeta(symbol, target) {
    if (isClass(target))
        return Reflect.getMetadata(symbol, target.prototype);
    else
        return Reflect.getMetadata(symbol, target);
}
exports.mapMeta = mapMeta;
function getMeta(symbol, target) {
    if (isClass(target))
        return Reflect.getMetadata(symbol, target.prototype);
    else
        return Reflect.getMetadata(symbol, target);
}
exports.getMeta = getMeta;
function isClass(fn) {
    const toString = Function.prototype.toString;
    function fnBody(fn) {
        return toString.call(fn).replace(/^[^{]*{\s*/, '').replace(/\s*}[^}]*$/, '');
    }
    return typeof fn === 'function' && (/^class\s/.test(toString.call(fn)) ||
        /^.*classCallCheck\(/.test(fnBody(fn)));
}
//# sourceMappingURL=meta.js.map