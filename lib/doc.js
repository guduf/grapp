"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const doc_ref_1 = require("./doc_ref");
const meta_1 = require("./meta");
const grapp_1 = require("./grapp");
const utils_1 = require("./utils");
exports.DOC_DATA = Symbol('DOC_DATA');
class DocMeta extends grapp_1.GrappMeta {
    constructor(target, params) {
        super(target, params, doc_ref_1.DocRef);
        this.TypeRefClass = doc_ref_1.DocTypeRef;
        if (params.selector)
            this.selector = params.selector;
        else if (target.name)
            this.selector = target.name;
        else
            throw new Error('Selector is not defined');
        if (params.collectionName)
            this.collectionName = params.collectionName;
        else if (target.name)
            this.collectionName = utils_1.capitalize(utils_1.pluralize(this.selector));
        else
            throw new Error('None collectionName was specified and target as no name property');
    }
}
exports.DocMeta = DocMeta;
function decorateDoc(params = {}) {
    return function docDecorator(target) {
        grapp_1.setGrappMeta(target, new DocMeta(target, params));
    };
}
exports.decorateDoc = decorateDoc;
const DOC_ID = Symbol('DOC_ID');
exports.docDocIdDecorator = function docDocIdDecorator(target, key) {
    if (key !== 'id')
        throw new Error('DocId property must be named "id"');
    meta_1.defineMetaKey({}, DOC_ID, target, key);
};
function checkDocId(target) {
    return meta_1.mapMeta(DOC_ID, target).has('id');
}
exports.checkDocId = checkDocId;
//# sourceMappingURL=doc.js.map