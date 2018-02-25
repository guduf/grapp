"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const meta_1 = require("./meta");
const grapp_ref_1 = require("./grapp_ref");
const graphql_1 = require("graphql");
class GrappMeta {
    constructor(target, params, ctor = grapp_ref_1.GrappRef) {
        this.target = target;
        this.ctor = ctor;
        this.imports = Array.isArray(params.imports) ? params.imports : [];
        this.providers = Array.isArray(params.providers) ? params.providers : [];
        this.types = Array.isArray(params.types) ? params.types : [];
        this.resolvers = params.resolvers ? params.resolvers : {};
        this.source = new graphql_1.Source(params.schema, `@${this.target.name}`);
    }
}
exports.GrappMeta = GrappMeta;
const GRAPP_META = Symbol('GRAPP_META');
function decorateGrapp(params) {
    return function grappDecorator(target) {
        const meta = new GrappMeta(target, params);
        setGrappMeta(target, meta);
    };
}
exports.decorateGrapp = decorateGrapp;
function setGrappMeta(target, meta) {
    if (!(meta instanceof GrappMeta))
        throw new TypeError(`meta is not a instance of TypeMeta: ${target.name || typeof target}`);
    meta_1.defineMeta(meta, GRAPP_META, target);
}
exports.setGrappMeta = setGrappMeta;
function getGrappMeta(target) {
    return meta_1.getMeta(GRAPP_META, target);
}
exports.getGrappMeta = getGrappMeta;
//# sourceMappingURL=grapp.js.map