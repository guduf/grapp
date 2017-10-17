"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const doc_ref_1 = require("./doc_ref");
const pluralize_1 = require("pluralize");
const type_1 = require("./type");
exports.DOC_DATA = Symbol('DOC_DATA');
class DocMeta extends type_1.TypeMeta {
    constructor(target, params) {
        super(target, params, doc_ref_1.DocRef);
        if (params.collectionName)
            this.collectionName = params.collectionName;
        else if (!target.name)
            throw new Error('None collectionName was specified and target as no name property');
        else
            this.collectionName = pluralize_1.plural(target.name[0].toLocaleLowerCase() + target.name.slice(1));
    }
}
exports.DocMeta = DocMeta;
function decorateDoc(params = {}) {
    return function docDecorator(target) {
        type_1.setTypeMeta(target, new DocMeta(target, params));
    };
}
exports.decorateDoc = decorateDoc;
class DocOpeMeta extends type_1.TypeMeta {
    constructor(target, params) {
        super(target, params, doc_ref_1.DocOpeRef);
        this.docTarget = params.docTarget;
    }
}
exports.DocOpeMeta = DocOpeMeta;
function decorateDocOpe(params) {
    return function docOpeDecorator(target) {
        type_1.setTypeMeta(target, new DocOpeMeta(target, params));
    };
}
exports.decorateDocOpe = decorateDocOpe;
//# sourceMappingURL=doc.js.map