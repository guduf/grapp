"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const meta_1 = require("./meta");
class GrappMeta {
    constructor(target, params) {
        this.target = target;
        this.imports = params.imports || [];
        this.providers = params.providers || [];
        this.types = params.types || [];
        this.resolvers = params.resolvers || [];
        this.schema = params.schema;
    }
}
exports.GrappMeta = GrappMeta;
const GRAPP_META = Symbol('GRAPP_META');
function decorateGrapp(params) {
    return function grappDecorator(target) {
        const meta = new GrappMeta(target, params);
        meta_1.defineMeta(meta, GRAPP_META, target);
    };
}
exports.decorateGrapp = decorateGrapp;
function getGrappMeta(target) {
    return meta_1.getMeta(GRAPP_META, target);
}
exports.getGrappMeta = getGrappMeta;
//# sourceMappingURL=grapp.js.map