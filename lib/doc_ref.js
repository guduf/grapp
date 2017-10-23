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
const shortid_1 = require("shortid");
const data_fields_1 = require("./data_fields");
const doc_di_1 = require("./doc_di");
const doc_1 = require("./doc");
const grapp_ref_1 = require("./grapp_ref");
const type_ref_1 = require("./type_ref");
const validators_1 = require("./validators");
class DocRef extends grapp_ref_1.GrappRef {
    constructor(root, target, meta) {
        super(root, target, meta);
        this.collection = this.root.db.collection(this.meta.collectionName);
        const docMutation = {
            create: (candidate) => this.create(candidate),
            remove: id => this.remove(id),
            update: (id, update) => this.update(id, update),
            validate: (candidate) => this.validate(candidate)
        };
        const docQuery = {
            find: query => this.find(query),
            findOne: query => this.findOne(query)
        };
        this.injector = this.injector.resolveAndCreateChild([
            { provide: doc_di_1.COLLECTION, useValue: this.collection },
            { provide: doc_di_1.DocMutation, useValue: docMutation },
            { provide: doc_di_1.DocQuery, useValue: docQuery }
        ]);
        try {
            this.docTypeRef = new DocTypeRef(this, target, meta);
        }
        catch (err) {
            console.error(err);
            throw new Error('Cannot reference docTypeRef: ' + target.name || typeof target);
        }
        this.typeRefs.set(this.meta.selector, this.docTypeRef);
        const dataFields = new Map();
        for (const [fieldName, fieldRef] of this.docTypeRef.fields)
            if (fieldRef instanceof data_fields_1.DataFieldRef)
                dataFields.set(fieldName, fieldRef.meta);
        this.dataFields = dataFields;
        for (const operationTarget of this.meta.docOperations) {
            const operationRef = this.referenceType(operationTarget);
            this.typeRefs.set(operationRef.selector, operationRef);
        }
    }
    create(candidate) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = candidate['id'] = (candidate['id'] || shortid_1.generate());
            let body = {};
            for (const [fieldName, fieldMeta] of this.dataFields) {
                const value = candidate[fieldName];
                if (fieldMeta.inputable) {
                    if (fieldMeta.required && typeof value === 'undefined')
                        throw new Error('Required field: ' + fieldName);
                    if (typeof value !== 'undefined') {
                        try {
                            if (fieldMeta.isArray) {
                                if (!Array.isArray(value))
                                    throw new TypeError(`${this.meta.selector}[${fieldName}]: Invalid Array`);
                                for (const val of value)
                                    validators_1.validate(val, ...fieldMeta.validators);
                            }
                            else
                                validators_1.validate(value, ...fieldMeta.validators);
                        }
                        catch (err) {
                            throw new Error(`${this.meta.selector}[${fieldName}]: ${err.message}`);
                        }
                        body[fieldName] = value;
                    }
                }
            }
            yield this.collection.insertOne(Object.assign({}, body, { id }));
            return this._instanciate(id);
        });
    }
    find(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const ids = yield this.collection.find(query, { id: true }).toArray();
            return ids.map(({ id }) => this._instanciate(id));
        });
    }
    findOne(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const ids = yield this.collection.find(query, { id: true }).limit(1).toArray();
            return ids.length ? this._instanciate(ids[0].id) : null;
        });
    }
    remove(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.collection.remove({ id });
            return Boolean(data.result.n);
        });
    }
    update(id, update) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = {};
            for (const [fieldName, fieldMeta] of this.dataFields)
                if (fieldMeta instanceof data_fields_1.DataFieldMeta) {
                    const value = update[fieldName];
                    if (fieldMeta.updatable) {
                        if (typeof value !== 'undefined') {
                            try {
                                if (fieldMeta.isArray) {
                                    if (!Array.isArray(value))
                                        throw new TypeError('Invalid Array');
                                    for (const val of value)
                                        validators_1.validate(val, ...fieldMeta.validators);
                                }
                                else
                                    validators_1.validate(value, ...fieldMeta.validators);
                            }
                            catch (err) {
                                throw new Error(`${this.meta.selector}[${fieldName}]: ${err.message}`);
                            }
                            body[fieldName] = value;
                        }
                    }
                }
            yield this.collection.updateOne({ id }, { $set: body });
            return this._instanciate(id);
        });
    }
    validate(candidate) {
        const body = {};
        for (const [fieldName, fieldMeta] of this.dataFields)
            if (fieldMeta instanceof data_fields_1.DataFieldMeta) {
                const value = candidate[fieldName];
                if (typeof value === 'undefined') {
                    if (fieldMeta.required)
                        throw new TypeError(`Required field [${fieldName}]`);
                }
                else {
                    try {
                        if (fieldMeta.isArray) {
                            if (!Array.isArray(value))
                                throw new TypeError(`Invalid Array`);
                            for (const val of value)
                                validators_1.validate(val, ...fieldMeta.validators);
                        }
                        else
                            validators_1.validate(value, ...fieldMeta.validators);
                    }
                    catch (err) {
                        throw new Error(`${this.meta.selector}[${fieldName}]: ${err.message}`);
                    }
                    body[fieldName] = value;
                }
            }
        return body;
    }
    _instanciate(id) {
        return this.docTypeRef.instanciate({ id });
    }
}
exports.DocRef = DocRef;
class DocTypeRef extends type_ref_1.TypeRef {
    constructor(grappRef, target, meta) {
        super(grappRef, target, meta);
        if (!doc_1.checkDocId(target))
            throw new Error('TypeTarget has no been decorated with DocId');
        const idMeta = new data_fields_1.DataFieldMeta(target, 'id', {
            required: true,
            inputable: true,
            updatable: false,
            validators: [validators_1.Validators.shortid], isArray: false
        });
        this.fields.set('id', new data_fields_1.DataFieldRef(this, 'id', idMeta));
    }
    instanciate(payload) {
        if (!payload || !payload.id)
            throw new Error('Instanciate doc requires a payload with id member');
        const instance = type_ref_1.TypeRef.prototype.instanciate.call(this, payload);
        instance[doc_1.DOC_DATA] = { id: payload.id };
        return instance;
    }
}
exports.DocTypeRef = DocTypeRef;
//# sourceMappingURL=doc_ref.js.map