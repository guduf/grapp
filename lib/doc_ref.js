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
const di_1 = require("./di");
const doc_1 = require("./doc");
const fields_1 = require("./fields");
const type_1 = require("./type");
const type_ref_1 = require("./type_ref");
const validators_1 = require("./validators");
class DocRef extends type_ref_1.TypeRef {
    constructor(grappRef, target, meta) {
        super(grappRef, target, meta);
        this.grappRef = grappRef;
        this.target = target;
        this.meta = meta;
        this.collection = this.grappRef.root.db.collection(this.meta.collectionName);
    }
    instanciate(payload) {
        if (!payload || !payload.id)
            throw new Error('Instanciate doc requires a payload with id member');
        const injector = this.injector.resolveAndCreateChild([
            { provide: di_1.COLLECTION, useValue: this.collection },
            { provide: di_1.PAYLOAD, useValue: payload }
        ]);
        const instance = injector.resolveAndInstantiate(this.target);
        instance[doc_1.DOC_DATA] = { id: payload.id };
        for (const [key, fieldRef] of this.fields)
            if (fieldRef.defineProperty)
                fieldRef.defineProperty(instance);
        return instance;
    }
}
exports.DocRef = DocRef;
class DocOpeRef extends type_ref_1.TypeRef {
    constructor(grappRef, target, meta) {
        super(grappRef, target, meta);
        this.grappRef = grappRef;
        this.target = target;
        this.meta = meta;
        this.targetMeta = type_1.getTypeMeta(this.meta.docTarget);
        this.targetFields = fields_1.mapFieldMeta(this.meta.docTarget);
        this.collection = this.grappRef.root.db.collection(this.targetMeta.collectionName);
    }
    instanciate() {
        const injector = this.injector.resolveAndCreateChild([
            { provide: di_1.COLLECTION, useValue: this.collection },
            { provide: di_1.CREATE_DOC, useValue: (args) => this._createDoc(args) },
            { provide: di_1.REMOVE_DOC, useValue: (args) => this._removeDoc(args) },
            { provide: di_1.UPDATE_DOC, useValue: (args) => this._updateDoc(args) },
            { provide: di_1.VALIDATE_DOC, useValue: (candidate) => this._validateDoc(candidate) }
        ]);
        const instance = injector.resolveAndInstantiate(this.target);
        for (const [key, fieldRef] of this.fields)
            if (fieldRef.defineProperty)
                fieldRef.defineProperty(instance);
        return instance;
    }
    _createDoc({ candidate }) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = {};
            for (const [fieldName, fieldMeta] of this.targetFields)
                if (fieldMeta instanceof data_fields_1.DataFieldMeta) {
                    const value = candidate[fieldName];
                    if (fieldMeta.inputable) {
                        if (fieldMeta.required && typeof value === 'undefined')
                            throw new Error('Required field: ' + fieldName);
                        if (typeof value !== 'undefined') {
                            try {
                                if (fieldMeta.isArray) {
                                    if (!Array.isArray(value))
                                        throw new TypeError(`${this.targetMeta.selector}[${fieldName}]: Invalid Array`);
                                    for (const val of value)
                                        validators_1.validate(val, ...fieldMeta.validators);
                                }
                                else
                                    validators_1.validate(value, ...fieldMeta.validators);
                            }
                            catch (err) {
                                throw new Error(`${this.targetMeta.selector}[${fieldName}]: ${err.message}`);
                            }
                            body[fieldName] = value;
                        }
                    }
                }
            const id = body['id'] || shortid_1.generate();
            yield this.collection.insertOne(Object.assign({}, body, { id }));
            return this.grappRef.root.typer(this.targetMeta.selector, { id });
        });
    }
    _removeDoc({ id }) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.collection.remove({ id });
            return Boolean(data.result.n);
        });
    }
    _updateDoc({ id, update }) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = {};
            for (const [fieldName, fieldMeta] of this.targetFields)
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
                                throw new Error(`${this.targetMeta.selector}[${fieldName}]: ${err.message}`);
                            }
                            body[fieldName] = value;
                        }
                    }
                }
            yield this.collection.updateOne({ id }, { $set: body });
            return this.grappRef.root.typer(this.targetMeta.selector, { id });
        });
    }
    _validateDoc(candidate) {
        const body = {};
        for (const [fieldName, fieldMeta] of this.targetFields)
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
                        throw new Error(`${this.targetMeta.selector}[${fieldName}]: ${err.message}`);
                    }
                    body[fieldName] = value;
                }
            }
        return body;
    }
}
exports.DocOpeRef = DocOpeRef;
//# sourceMappingURL=doc_ref.js.map