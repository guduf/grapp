"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const doc_ref_1 = require("./doc_ref");
const fields_1 = require("./fields");
const utils_1 = require("./utils");
class RelationFieldMeta extends fields_1.FieldMeta {
    constructor(target, key, params) {
        super(target, key, params, RelationFieldRef);
        this.kind = params.kind;
        this.foreignSelector = params.foreignSelector;
        this.query = params.query;
    }
}
exports.RelationFieldMeta = RelationFieldMeta;
class RelationFieldRef extends fields_1.FieldRef {
    constructor(typeRef, key, meta) {
        super(typeRef, key, meta);
        this.defineValue = instance => () => this._fetchData(instance);
        if (!(this.typeRef instanceof doc_ref_1.DocTypeRef))
            throw new Error('typeRef must be instance DocTypeRef for RelationFieldRef');
    }
    _fetchData(instance) {
        return __awaiter(this, void 0, void 0, function* () {
            const { foreignSelector, kind, query } = this.meta;
            const foreignDocTypeRef = this.typeRef.grappRef.root.getTypeRef(foreignSelector);
            if (!(foreignDocTypeRef instanceof doc_ref_1.DocRef))
                throw new Error('foreignDocTypeRef is not instance of DocRef');
            if (kind[0] === 'b') {
                let docIdKey = this.typeRef.selector[0].toLocaleLowerCase() + this.typeRef.selector.slice(1) + 'Id';
                if (!foreignDocTypeRef.fields.has(docIdKey)) {
                    if (foreignDocTypeRef.fields.has(utils_1.pluralize(docIdKey)))
                        docIdKey = utils_1.pluralize(docIdKey);
                    else
                        throw new Error('Cannot find docIdKey in foreignDocTypeRef: ' + docIdKey);
                }
                switch (kind) {
                    case 'btm': {
                        const btmQuery = Object.assign({}, query, { [docIdKey]: (yield instance.id) });
                        const data = yield foreignDocTypeRef.collection.find(btmQuery, { id: true }).toArray();
                        return data.map(({ id }) => foreignDocTypeRef.instanciate({ id }));
                    }
                    case 'bto': {
                        const btoQuery = Object.assign({}, query, { [docIdKey]: (yield instance.id) });
                        const data = yield foreignDocTypeRef.collection.findOne(btoQuery);
                        return foreignDocTypeRef.instanciate(data);
                    }
                }
            }
            else if (kind[0] === 'h') {
                let foreignDocIdKey = foreignDocTypeRef.selector[0].toLocaleLowerCase() + foreignDocTypeRef.selector.slice(1) + 'Id';
                switch (kind) {
                    case 'hm': {
                        if (!this.typeRef.fields.has(utils_1.pluralize(foreignDocIdKey)))
                            throw new Error('Cannot find foreignDocId in DocRef: ' + utils_1.pluralize(foreignDocIdKey));
                        const ids = yield instance[utils_1.pluralize(foreignDocIdKey)];
                        const hmQuery = Object.assign({}, query, { id: { $in: ids } });
                        const data = yield foreignDocTypeRef.collection.find(hmQuery, { id: true }).toArray();
                        return data.map(({ id }) => foreignDocTypeRef.instanciate({ id }));
                    }
                    case 'ho': {
                        if (!this.typeRef.fields.has(foreignDocIdKey))
                            throw new Error('Cannot find foreignDocId in DocRef: ' + foreignDocIdKey);
                        const docId = yield instance[foreignDocIdKey];
                        const hoQuery = Object.assign({}, query, { id: docId });
                        const { id } = yield foreignDocTypeRef.collection.findOne(hoQuery);
                        return foreignDocTypeRef.instanciate({ id });
                    }
                }
            }
            else
                throw new ReferenceError('Cannot fing the relation kind: ' + kind);
        });
    }
}
exports.RelationFieldRef = RelationFieldRef;
function buildRelationFieldDecorator(kind) {
    return (foreignSelector, query = {}) => {
        return function decorateRelationField(target, key) {
            const meta = new RelationFieldMeta(target, key, { kind, foreignSelector, query });
            fields_1.setFieldMeta(target, key, meta);
        };
    };
}
exports.buildRelationFieldDecorator = buildRelationFieldDecorator;
exports.Relation = {
    belongsToMany: buildRelationFieldDecorator('btm'),
    belongsToOne: buildRelationFieldDecorator('bto'),
    hasMany: buildRelationFieldDecorator('hm'),
    hasOne: buildRelationFieldDecorator('ho')
};
//# sourceMappingURL=relation_fields.js.map