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
const pluralize_1 = require("pluralize");
class RelationFieldMeta {
    constructor(kind, foreignSelector, query) {
        this.kind = kind;
        this.foreignSelector = foreignSelector;
        this.query = query;
        this.FieldRefClass = RelationFieldRef;
    }
}
exports.RelationFieldMeta = RelationFieldMeta;
class RelationFieldRef {
    constructor(typeRef, key, meta) {
        this.typeRef = typeRef;
        this.key = key;
        this.meta = meta;
    }
    defineProperty(instance) {
        const descriptor = {
            get: () => { return this.resolve(instance); },
            set: (newValue) => { throw new Error('You cant set a decorated property'); },
            enumerable: true,
            configurable: false
        };
        Object.defineProperty(instance, this.key, descriptor);
    }
    resolve(instance) { return this._fetchData(instance); }
    _fetchData(instance) {
        return __awaiter(this, void 0, void 0, function* () {
            const { foreignSelector, kind, query } = this.meta;
            const foreignDocRef = this.typeRef.grappRef.root.getTypeRef(foreignSelector);
            if (!(foreignDocRef instanceof doc_ref_1.DocRef))
                throw new Error('foreignDocRef is not instance of DocRef');
            if (kind[0] === 'b') {
                let docIdKey = this.typeRef.selector[0].toLocaleLowerCase() + this.typeRef.selector.slice(1) + 'Id';
                if (!foreignDocRef.fields.has(docIdKey)) {
                    if (foreignDocRef.fields.has(pluralize_1.plural(docIdKey)))
                        docIdKey = pluralize_1.plural(docIdKey);
                    else
                        throw new Error('Cannot find docIdKey in foreignDocRef: ' + docIdKey);
                }
                switch (kind) {
                    case 'btm': {
                        const btmQuery = Object.assign({}, query, { [docIdKey]: (yield instance.id) });
                        const data = yield foreignDocRef.collection.find(btmQuery, { id: true }).toArray();
                        return data.map(({ id }) => foreignDocRef.instanciate({ id }));
                    }
                    case 'bto': {
                        const btoQuery = Object.assign({}, query, { [docIdKey]: (yield instance.id) });
                        const data = yield foreignDocRef.collection.findOne(btoQuery);
                        return foreignDocRef.instanciate(data);
                    }
                }
            }
            else if (kind[0] === 'h') {
                let foreignDocIdKey = foreignDocRef.selector[0].toLocaleLowerCase() + foreignDocRef.selector.slice(1) + 'Id';
                switch (kind) {
                    case 'hm': {
                        if (!this.typeRef.fields.has(pluralize_1.plural(foreignDocIdKey)))
                            throw new Error('Cannot find foreignDocId in DocRef: ' + pluralize_1.plural(foreignDocIdKey));
                        const ids = yield instance[pluralize_1.plural(foreignDocIdKey)];
                        const hmQuery = Object.assign({}, query, { id: { $in: ids } });
                        const data = yield foreignDocRef.collection.find(hmQuery, { id: true }).toArray();
                        return data.map(({ id }) => foreignDocRef.instanciate({ id }));
                    }
                    case 'ho': {
                        if (!this.typeRef.fields.has(foreignDocIdKey))
                            throw new Error('Cannot find foreignDocId in DocRef: ' + foreignDocIdKey);
                        const docId = yield instance[foreignDocIdKey];
                        const hoQuery = Object.assign({}, query, { id: docId });
                        const { id } = yield foreignDocRef.collection.findOne(hoQuery);
                        return foreignDocRef.instanciate({ id });
                    }
                }
            }
            else
                throw new ReferenceError('Cannot fing the relation kind: ' + kind);
        });
    }
}
exports.RelationFieldRef = RelationFieldRef;
function buildRelationFieldDecorator(kind, foreignSelector, query = {}) {
    const meta = new RelationFieldMeta(kind, foreignSelector, query);
    return fields_1.decorateField(meta);
}
exports.buildRelationFieldDecorator = buildRelationFieldDecorator;
function belongsToMany(selector, query) {
    return buildRelationFieldDecorator('btm', selector, query);
}
exports.belongsToMany = belongsToMany;
function belongsToOne(selector, query) {
    return buildRelationFieldDecorator('bto', selector, query);
}
exports.belongsToOne = belongsToOne;
function hasMany(selector, query) {
    return buildRelationFieldDecorator('hm', selector, query);
}
exports.hasMany = hasMany;
function hasOne(selector, query) {
    return buildRelationFieldDecorator('ho', selector, query);
}
exports.hasOne = hasOne;
exports.Relation = { belongsToMany, belongsToOne, hasMany, hasOne };
//# sourceMappingURL=relation_fields.js.map