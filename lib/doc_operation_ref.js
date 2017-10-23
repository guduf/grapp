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
const operation_ref_1 = require("./operation_ref");
const validators_1 = require("./validators");
class DocOperationRef extends operation_ref_1.OperationRef {
    constructor(docRef, target, meta) {
        super(docRef.grappRef, target, meta);
        this.docRef = docRef;
        this.target = target;
        this.meta = meta;
    }
    instanciate() {
        const docMutation = {
            create: (candidate) => this._createDoc(candidate),
            remove: id => this._removeDoc(id),
            update: (id, update) => this._updateDoc(id, update),
            validate: (candidate) => this._validateDoc(candidate)
        };
        const docQuery = {
            find: query => this._findDoc(query),
            findOne: query => this._findOneDoc(query)
        };
        const injector = this.injector.resolveAndCreateChild([
            { provide: doc_di_1.COLLECTION, useValue: this.docRef.collection },
            { provide: doc_di_1.DocMutation, useValue: docMutation },
            { provide: doc_di_1.DocQuery, useValue: docQuery }
        ]);
        const instance = injector.resolveAndInstantiate(this.target);
        for (const [key, fieldRef] of this.fields)
            if (fieldRef.defineProperty)
                fieldRef.defineProperty(instance);
        return instance;
    }
    _createDoc(candidate) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = {};
            for (const [fieldName, fieldMeta] of this.docRef.fields)
                if (fieldMeta instanceof data_fields_1.DataFieldMeta) {
                    const value = candidate[fieldName];
                    if (fieldMeta.inputable) {
                        if (fieldMeta.required && typeof value === 'undefined')
                            throw new Error('Required field: ' + fieldName);
                        if (typeof value !== 'undefined') {
                            try {
                                if (fieldMeta.isArray) {
                                    if (!Array.isArray(value))
                                        throw new TypeError(`${this.docRef.meta.selector}[${fieldName}]: Invalid Array`);
                                    for (const val of value)
                                        validators_1.validate(val, ...fieldMeta.validators);
                                }
                                else
                                    validators_1.validate(value, ...fieldMeta.validators);
                            }
                            catch (err) {
                                throw new Error(`${this.docRef.meta.selector}[${fieldName}]: ${err.message}`);
                            }
                            body[fieldName] = value;
                        }
                    }
                }
            const id = body['id'] || shortid_1.generate();
            yield this.docRef.collection.insertOne(Object.assign({}, body, { id }));
            return this.docRef.instanciate({ id });
        });
    }
    _findDoc(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const ids = yield this.docRef.collection.find(query, { id: true }).toArray();
            return ids.map(id => this.docRef.instanciate(id));
        });
    }
    _findOneDoc(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const ids = yield this.docRef.collection.find(query, { id: true }).limit(1).toArray();
            return ids.length ? this.docRef.instanciate(ids[0]) : null;
        });
    }
    _removeDoc(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.docRef.collection.remove({ id });
            return Boolean(data.result.n);
        });
    }
    _updateDoc(id, update) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = {};
            for (const [fieldName, fieldMeta] of this.docRef.fields)
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
                                throw new Error(`${this.docRef.meta.selector}[${fieldName}]: ${err.message}`);
                            }
                            body[fieldName] = value;
                        }
                    }
                }
            yield this.docRef.collection.updateOne({ id }, { $set: body });
            return this.docRef.instanciate({ id });
        });
    }
    _validateDoc(candidate) {
        const body = {};
        for (const [fieldName, fieldMeta] of this.docRef.fields)
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
                        throw new Error(`${this.docRef.meta.selector}[${fieldName}]: ${err.message}`);
                    }
                    body[fieldName] = value;
                }
            }
        return body;
    }
}
exports.DocOperationRef = DocOperationRef;
//# sourceMappingURL=doc_operation_ref.js.map