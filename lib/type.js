"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const di_1 = require("./di");
const type_ref_1 = require("./type_ref");
const meta_1 = require("./meta");
class TypeMeta {
    constructor(target, params, TypeRefClass = type_ref_1.TypeRef) {
        this.TypeRefClass = TypeRefClass;
        if (typeof params !== 'object')
            throw new TypeError('Params is not a object');
        this.providers = params.providers || [];
        if (params.selector)
            this.selector = params.selector;
        else if (target.name)
            this.selector = target.name;
        else
            throw new Error('Selector is not defined');
    }
}
exports.TypeMeta = TypeMeta;
const TYPE_META = Symbol('TYPE_META');
function decorateType(params = {}) {
    return function docDecorator(target) {
        setTypeMeta(target, new TypeMeta(target, params));
    };
}
exports.decorateType = decorateType;
function setTypeMeta(target, meta) {
    if (!(meta instanceof TypeMeta))
        throw new TypeError(`meta is not a instance of TypeMeta: ${target.name || typeof target}`);
    di_1.Injectable()(target);
    meta_1.defineMeta(meta, TYPE_META, target);
}
exports.setTypeMeta = setTypeMeta;
function getTypeMeta(target) {
    return meta_1.getMeta(TYPE_META, target);
}
exports.getTypeMeta = getTypeMeta;
//# sourceMappingURL=type.js.map