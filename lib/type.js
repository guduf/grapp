"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const di_1 = require("./di");
const type_ref_1 = require("./type_ref");
const meta_1 = require("./meta");
const graphql_1 = require("graphql");
const field_1 = require("./field");
class TypeMeta {
    constructor(target, { selector, providers, schema } = {}, TypeRefClass = type_ref_1.TypeRef) {
        this.target = target;
        this.TypeRefClass = TypeRefClass;
        this.providers = providers || [];
        if (selector)
            this.selector = selector;
        else if (target.name)
            this.selector = target.name;
        else
            throw new Error('Selector is not defined');
        if (schema)
            this.source = new graphql_1.Source(schema, `@${this.selector}`);
        const fields = field_1.mapFieldMeta(target);
        for (const key of Object.getOwnPropertyNames(target.prototype))
            if (!fields.has(key) &&
                ['constructor'].indexOf(key) < 0 &&
                key[0] !== '_')
                fields.set(key, new field_1.FieldMeta(target, key, {}));
        this.fields = fields;
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