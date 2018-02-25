"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const field_ref_1 = require("./field_ref");
const meta_1 = require("./meta");
exports.FIELD_META = Symbol('FIELD_META');
class FieldMeta {
    constructor(target, key, params, FieldRefClass = field_ref_1.FieldRef) {
        this.key = key;
        this.FieldRefClass = FieldRefClass;
    }
}
exports.FieldMeta = FieldMeta;
function decorateField(meta) {
    return function fieldDecorator(target, key) {
        const meta = new FieldMeta(target, key, {});
        setFieldMeta(target, key, meta);
    };
}
exports.decorateField = decorateField;
function setFieldMeta(target, key, meta) {
    if (!(meta instanceof FieldMeta))
        throw new TypeError(`meta is not a instance of FieldMeta: ${target.name || typeof target}[${key}]`);
    meta_1.defineMetaKey(meta, exports.FIELD_META, target, key);
}
exports.setFieldMeta = setFieldMeta;
function mapFieldMeta(target) {
    return meta_1.mapMeta(exports.FIELD_META, target);
}
exports.mapFieldMeta = mapFieldMeta;
//# sourceMappingURL=field.js.map