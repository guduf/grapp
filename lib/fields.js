"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const meta_1 = require("./meta");
exports.FIELDS_META = Symbol('FIELDS_META');
function decorateField(meta) {
    return function fieldDecorator(target, key) {
        meta_1.defineMetaKey(meta, exports.FIELDS_META, target, key);
    };
}
exports.decorateField = decorateField;
function mapFieldMeta(target) {
    return meta_1.mapMeta(exports.FIELDS_META, target);
}
exports.mapFieldMeta = mapFieldMeta;
//# sourceMappingURL=fields.js.map